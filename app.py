                "table_index": tbl["table_index"],
                "filename": filename,
                "first_cell": tbl.get("first_cell", ""),
            })
        print(f"[parse-multiple] 从 Word 提取表格图片 {len(all_table_images)} 张")

    # 推断本地服务器 base_url（供图片 URL 拼接）
    _port = 8766
    _image_base_url = f"http://localhost:{_port}"

    files_data = []
    for i in range(len(valid)):
        text_i, imgs_i, tables_i, colors_i = text_and_images[i]
        ext_i = (filenames[i] or "").lower().split(".")[-1]
        is_pdf = ext_i == "pdf"
        # 对于 PDF，tables_i 实际上是渲染的页面图片（已按 page_index 排序）
        page_images_i = tables_i if is_pdf else []
        
        # 判断 PDF 是否需要视觉识别：
        # - 扫描件：文字极少（< 100 字符）→ 必须用视觉
        # - 可提取文字的 PDF：直接用文字解析，省 AI 视觉 token
        text_len = len((text_i or "").strip())
        is_scanned_pdf = is_pdf and text_len < 100
        
        # 快速识别文件类型（不调 LLM）
        file_info = classify_file_fast(filenames[i], text_i)
        files_data.append({
            "filename": filenames[i],
            "text": text_i,
            "content": contents[i],
            "is_pdf": is_pdf,
            "is_scanned_pdf": is_scanned_pdf,
            "page_images": page_images_i,  # 保留页面图片，扫描件时使用
            "color_by_qnum": colors_i or {},
            **file_info,
        })
        if is_pdf:
            if is_scanned_pdf:
                print(f"[parse-multiple] 文件 '{filenames[i]}' -> PDF 扫描件（文字 {text_len} 字符），将使用视觉识别（{len(page_images_i)} 页）")
            else:
                print(f"[parse-multiple] 文件 '{filenames[i]}' -> PDF（文字 {text_len} 字符），直接解析文字")
        else:
            print(f"[parse-multiple] 文件 '{filenames[i]}' -> 类型: {file_info['file_type']}")

    # 2. 分类文件
    exam_files = [f for f in files_data if f["file_type"] == "exam"]
    answer_files = [f for f in files_data if f["file_type"] == "answer_material"]
    combined_files = [f for f in files_data if f["file_type"] == "combined"]
    
    print(f"[parse-multiple] 试题文件: {len(exam_files)} 个, 答案材料: {len(answer_files)} 个, 题答合并: {len(combined_files)} 个")

    want_debug = (debug or "").strip().lower() in ("1", "true", "yes")
    debug_info = None
    
    # 检查是否有扫描件 PDF 需要视觉识别
    scanned_pdfs = [f for f in files_data if f.get("is_scanned_pdf")]

    try:
        # 3. 根据文件组合选择解析策略
        
        # 特殊情况：扫描件 PDF → 使用视觉模型识别
        if len(scanned_pdfs) > 0 and len(files_data) == len(scanned_pdfs):
            print("[parse-multiple] 策略: PDF 扫描件视觉识别")
            # 合并所有 PDF 的页面图片，保持文件顺序 + 页码顺序
            all_page_images = []
            all_text = []
            page_offset = 0  # 用于多文件时的页码偏移，确保全局顺序
            for f in scanned_pdfs:
                all_text.append(f.get("text", ""))
                file_pages = f.get("page_images", [])
                # 按页码排序后添加，更新全局 page_index
                sorted_pages = sorted(file_pages, key=lambda x: x.get("page_index", 0))
                for pg in sorted_pages:
                    pg_copy = dict(pg)
                    pg_copy["page_index"] = page_offset + pg.get("page_index", 0)
                    all_page_images.append(pg_copy)
                page_offset += len(sorted_pages)
            
            combined_text = "\n\n".join(t for t in all_text if t.strip())
            out = await parse_pdf_with_images(
                combined_text,
                all_page_images,
                field_structure=parsed_field_structure,
                paper_metadata=paper_metadata,
                return_debug=want_debug,
                **llm_params,
            )
            if want_debug:
                questions, debug_info = out
            else:
                questions = out
        
        elif len(combined_files) >= 1 and len(exam_files) == 0 and len(answer_files) == 0:
            # 情况 AA：题目+答案+听力材料全在同一文件（内嵌答案格式如 (C)1.A. B. C.）
            print("[parse-multiple] 策略: 题答合并文件解析（内嵌答案）")
            # 多个 combined 文件时合并文本
            combined_text = "\n\n---\n\n".join(f["text"] for f in combined_files)
            out = await parse_single_file(
                combined_text,
                field_structure=parsed_field_structure,
                paper_metadata=paper_metadata,
                return_debug=want_debug,
                **llm_params,
            )
            if want_debug:
                questions, debug_info = out
            else:
                questions = out

        elif len(exam_files) == 1 and len(answer_files) == 1:
            # 情况 A：一个试题 + 一个答案材料 → 合并解析
            print("[parse-multiple] 策略: 试题+答案材料合并解析")
            out = await parse_exam_with_answers(
                exam_files[0]["text"],
                answer_files[0]["text"],
                field_structure=parsed_field_structure,
                paper_metadata=paper_metadata,
                return_debug=want_debug,
                **llm_params,
            )
            if want_debug:
                questions, debug_info = out
            else:
                questions = out

        elif len(exam_files) == 1 and len(answer_files) == 0:
            # 情况 B：只有一个试题文件 → 单独解析
            print("[parse-multiple] 策略: 单试题文件解析")
            out = await parse_single_file(
                exam_files[0]["text"],
                field_structure=parsed_field_structure,
                paper_metadata=paper_metadata,
                return_debug=want_debug,
                **llm_params,
            )
            if want_debug:
                questions, debug_info = out
            else:
                questions = out

        elif len(exam_files) == 0 and len(answer_files) == 1:
            # 情况 C：只有答案材料（可能包含完整信息）→ 单独解析
            print("[parse-multiple] 策略: 答案材料文件解析（可能包含完整题目）")
            out = await parse_single_file(
                answer_files[0]["text"],
                field_structure=parsed_field_structure,
                paper_metadata=paper_metadata,
                return_debug=want_debug,
                **llm_params,
            )
            if want_debug:
                questions, debug_info = out
            else:
                questions = out

        elif len(files_data) == 1:
            # 情况 D：只有一个文件 → 直接解析
            print("[parse-multiple] 策略: 单文件解析")
            out = await parse_single_file(
                files_data[0]["text"],
                field_structure=parsed_field_structure,
                paper_metadata=paper_metadata,
                return_debug=want_debug,
                **llm_params,
            )
            if want_debug:
                questions, debug_info = out
            else:
                questions = out

        else:
            # 情况 E：多个文件，复杂情况 → 合并所有文本一起解析
            print("[parse-multiple] 策略: 多文件合并解析")
            # 优先用试题文件，再加答案材料，combined 文件也包含进来
            all_texts = [f["text"] for f in exam_files] + [f["text"] for f in answer_files] + [f["text"] for f in combined_files]
            if not all_texts:
                all_texts = [f["text"] for f in files_data]

            combined_text = "\n\n---\n\n".join(all_texts)
            out = await parse_single_file(
                combined_text,
                field_structure=parsed_field_structure,
                paper_metadata=paper_metadata,
                return_debug=want_debug,
                **llm_params,
            )
            if want_debug:
                questions, debug_info = out
            else:
                questions = out

        print(f"[parse-multiple] 解析完成，共 {len(questions)} 题")

        # Word 彩色选项答案回填（不依赖 prompt；仅填空 answer、不覆盖已有答案）
        if merged_color_by_qnum:
            before = sum(1 for q in questions if isinstance(q, dict) and str(q.get("answer") or "").strip())
            questions = apply_word_color_answers(questions, merged_color_by_qnum)
            after = sum(1 for q in questions if isinstance(q, dict) and str(q.get("answer") or "").strip())
            print(
                f"[parse-multiple] 彩色答案回填: Word 标记 {len(merged_color_by_qnum)} 题, "
                f"JSON 有答案 {before}→{after} 题"
            )

        # 解析页面结构（用于图片注入）
        parsed_slots = None
        if page_structure and page_structure.strip():
            try:
                parsed_slots = json_module.loads(page_structure)
            except Exception:
                parsed_slots = None

        # ── 图片选项注入 ──────────────────────────────────────────────────────
        if saved_images and parsed_slots:
            questions = _enrich_questions_with_option_images(
                questions,
                saved_images,
                session_id,
                _image_base_url,
                parsed_slots,
            )
            injected = sum(
                1 for q in questions
                for opt in q.get("options", [])
                if isinstance(opt, str) and opt.startswith(_image_base_url)
            )
            print(f"[parse-multiple] 图片选项注入完成，共替换 {injected} 个选项")

        # ── 表格图片注入（题干图片）──────────────────────────────────────────────
        if saved_table_images:
            # 策略：通过内容匹配将表格图片分配给对应的题目
            # 检查题目的 question/listening_script/retell_start 等字段是否包含表格的 first_cell 内容
            used_tables = set()
            
            for q_idx, q in enumerate(questions):
                # 检查该题对应的 slot 是否有 image_url 字段
                slot_idx = q_idx
                slot_has_image = False
                if parsed_slots and slot_idx < len(parsed_slots):
                    slot = parsed_slots[slot_idx]
                    slot_fields = slot.get("currentSlotFields", [])
                    slot_has_image = any(
                        f.get("role") == "image_url" or f == "image_url"
                        for f in slot_fields
                    ) if isinstance(slot_fields, list) else "image_url" in str(slot_fields)
                
                # 如果该题的录题页有图片字段，且题目没有 image_url，则尝试匹配表格
                existing_img = (q.get("image_url") or "").strip()
                if slot_has_image and not existing_img:
                    # 收集题目的文本内容用于匹配
                    q_texts = []
                    for field in ["question", "listening_script", "retell_start", "type"]:
                        val = q.get(field, "")
                        if val:
                            q_texts.append(str(val).lower())
                    # 也检查 blanks 中的内容
                    for blank in q.get("blanks", []):
                        for field in ["question", "listening_script"]:
                            val = blank.get(field, "")
                            if val:
                                q_texts.append(str(val).lower())
                    q_text_combined = " ".join(q_texts)
                    
                    # 找到与题目内容匹配的表格
                    matched_tbl = None
                    for tbl_idx, tbl_info in enumerate(saved_table_images):
                        if tbl_idx in used_tables:
                            continue
                        first_cell = (tbl_info.get("first_cell") or "").lower()
                        # 提取 first_cell 中的关键词（去掉数字和标点）
                        import re
                        keywords = re.findall(r'[a-zA-Z\u4e00-\u9fff]+', first_cell)
                        # 检查关键词是否出现在题目文本中
                        if keywords and any(kw in q_text_combined for kw in keywords if len(kw) > 2):
                            matched_tbl = tbl_info
                            used_tables.add(tbl_idx)
                            print(f"[parse-multiple] 题目 {q_idx+1} 匹配到表格 {tbl_idx} (first_cell 关键词匹配)")
                            break
                    
                    if matched_tbl:
                        q["image_url"] = f"{_image_base_url}/api/images/{session_id}/{matched_tbl['filename']}"
                        print(f"[parse-multiple] 题目 {q_idx+1} 注入表格图片: {matched_tbl['filename']}")
            
            # 如果还有未分配的表格，按顺序分配给剩余需要图片的题目
            remaining_tables = [t for i, t in enumerate(saved_table_images) if i not in used_tables]
            if remaining_tables:
                tbl_ptr = 0
                for q_idx, q in enumerate(questions):
                    if tbl_ptr >= len(remaining_tables):
                        break
                    slot_idx = q_idx
                    slot_has_image = False
                    if parsed_slots and slot_idx < len(parsed_slots):
                        slot = parsed_slots[slot_idx]
                        slot_fields = slot.get("currentSlotFields", [])
                        slot_has_image = any(
                            f.get("role") == "image_url" or f == "image_url"
                            for f in slot_fields
                        ) if isinstance(slot_fields, list) else "image_url" in str(slot_fields)
                    existing_img = (q.get("image_url") or "").strip()
                    if slot_has_image and not existing_img:
                        tbl_info = remaining_tables[tbl_ptr]
                        q["image_url"] = f"{_image_base_url}/api/images/{session_id}/{tbl_info['filename']}"
                        print(f"[parse-multiple] 题目 {q_idx+1} 注入剩余表格图片: {tbl_info['filename']} (顺序分配)")
                        tbl_ptr += 1

        # ── 非选项普通图片注入（如思维导图、题干图片）──────────────────────────────
        # 从 saved_images 中找出 option_label 为 None 的图片（非选项图片）
        if saved_images:
            non_option_images = [
                img for img in saved_images
                if img.get("option_label") is None
            ]
            if non_option_images:
                print(f"[parse-multiple] 发现 {len(non_option_images)} 张非选项图片（如思维导图）")
                
                # 过滤掉可能是分隔线的图片（宽高比 > 10 的细长图片）
                def is_likely_content_image(img_info):
                    """判断图片是否可能是内容图片（而非分隔线）"""
                    # 有 prev_para_text 的图片更可能是内容图片
                    if (img_info.get("prev_para_text") or "").strip():
                        return True
                    # 没有上下文信息，暂时保留（后续可以通过尺寸过滤）
                    return True
                
                # 优先使用有 prev_para_text 的图片进行内容匹配
                used_images = set()
                
                for q_idx, q in enumerate(questions):
                    # 检查该题的录题页是否有图片字段
                    slot_has_image = False
                    if parsed_slots and q_idx < len(parsed_slots):
                        slot = parsed_slots[q_idx]
                        slot_fields = slot.get("currentSlotFields", [])
                        slot_has_image = any(
                            f.get("role") == "image_url" or f == "image_url"
                            for f in slot_fields
                        ) if isinstance(slot_fields, list) else "image_url" in str(slot_fields)
                    
                    existing_img = (q.get("image_url") or "").strip()
                    if not slot_has_image or existing_img:
                        continue
                    
                    # 收集题目的文本内容用于匹配
                    q_texts = []
                    for field in ["question", "listening_script", "retell_start", "type"]:
                        val = q.get(field, "")
                        if val:
                            q_texts.append(str(val).lower())
                    for blank in q.get("blanks", []):
                        for field in ["question", "listening_script"]:
                            val = blank.get(field, "")
                            if val:
                                q_texts.append(str(val).lower())
                    q_text_combined = " ".join(q_texts)
                    
                    # 尝试通过 prev_para_text 匹配图片
                    matched_img = None
                    for img_idx, img_info in enumerate(non_option_images):
                        if img_idx in used_images:
                            continue
                        prev_text = (img_info.get("prev_para_text") or "").lower()
                        if not prev_text:
                            continue
                        # 提取关键词进行匹配
                        import re
                        keywords = re.findall(r'[a-zA-Z\u4e00-\u9fff]+', prev_text)
                        # 检查关键词是否出现在题目文本中
                        if keywords and any(kw in q_text_combined for kw in keywords if len(kw) > 2):
                            matched_img = img_info
                            used_images.add(img_idx)
                            print(f"[parse-multiple] 题目 {q_idx+1} 通过内容匹配到非选项图片 {img_idx}")
                            break
                    
                    if matched_img:
                        q["image_url"] = f"{_image_base_url}/api/images/{session_id}/{matched_img['filename']}"
                        print(f"[parse-multiple] 题目 {q_idx+1} 注入非选项图片: {matched_img['filename']}")
                
                # 剩余未匹配的图片，按顺序分配给还需要图片的题目（跳过分隔线）
                remaining_images = [
                    (i, img) for i, img in enumerate(non_option_images)
                    if i not in used_images and is_likely_content_image(img)
                ]
                if remaining_images:
                    img_ptr = 0
                    for q_idx, q in enumerate(questions):
                        if img_ptr >= len(remaining_images):
                            break
                        slot_has_image = False
                        if parsed_slots and q_idx < len(parsed_slots):
                            slot = parsed_slots[q_idx]
                            slot_fields = slot.get("currentSlotFields", [])
                            slot_has_image = any(
                                f.get("role") == "image_url" or f == "image_url"
                                for f in slot_fields
                            ) if isinstance(slot_fields, list) else "image_url" in str(slot_fields)
                        existing_img = (q.get("image_url") or "").strip()
