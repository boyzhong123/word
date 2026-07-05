/**
 * 直接批量导入到 Words / Cartoon Time / Story Time 子章节。
 *
 * 1. 粘贴本文件到 CMS 详情页控制台
 * 2. 确保已运行 01-create-units.js 和 04-create-sections.js
 * 3. 执行 importYilinUnit(1) 或 importYilinSection(1, 'Words')
 */
(function () {
  const TYPE_LABELS = {
    word: '单词',
    sent: '句子',
    para: '段落',
    dialog: '对话',
    asides: '旁白',
  };

  const SECTION_ORDER = ['Lead-in', 'Words', 'Cartoon Time', 'Story Time'];
  const UNITS = {"1": {"title": "Unit 1 Our school subjects", "sections": [{"name": "Lead-in", "items": [{"type": "sent", "content": "Chinese, Maths and English,", "translation": "语文、数学和英语，"}, {"type": "sent", "content": "Art and Science too!", "translation": "还有美术和科学！"}, {"type": "sent", "content": "They are fun to learn,", "translation": "学起来很有趣，"}, {"type": "sent", "content": "Fun for me and you.", "translation": "我和你都觉得有趣。"}, {"type": "sent", "content": "I work hard at school.", "translation": "我在学校努力学习。"}, {"type": "sent", "content": "That's what I love to do!", "translation": "那就是我爱做的事！"}]}, {"name": "Words", "items": [{"type": "word", "content": "subject", "translation": "学科，科目"}, {"type": "word", "content": "Chinese", "translation": "语文（课）；中国的"}, {"type": "word", "content": "English", "translation": "英语（课）；英语的"}, {"type": "word", "content": "Maths", "translation": "数学（课）"}, {"type": "word", "content": "PE", "translation": "体育（课）"}, {"type": "word", "content": "Art", "translation": "美术（课）"}, {"type": "word", "content": "Science", "translation": "科学（课）"}, {"type": "word", "content": "IT", "translation": "信息科技（课）"}, {"type": "word", "content": "Music", "translation": "音乐（课）"}, {"type": "word", "content": "Labour", "translation": "劳动（课）"}, {"type": "word", "content": "best", "translation": "最，最高程度地"}, {"type": "word", "content": "also", "translation": "也"}, {"type": "word", "content": "It's time for ...", "translation": "是……的时候了。"}, {"type": "word", "content": "mouse", "translation": "鼠标；老鼠"}, {"type": "word", "content": "Welcome back to ...", "translation": "欢迎回到……"}, {"type": "word", "content": "be good at", "translation": "擅长"}, {"type": "word", "content": "interesting", "translation": "有趣的，有吸引力的"}, {"type": "word", "content": "learn about", "translation": "学习"}, {"type": "word", "content": "culture", "translation": "文化，文明"}, {"type": "word", "content": "read", "translation": "阅读"}, {"type": "word", "content": "story", "translation": "故事"}, {"type": "word", "content": "all", "translation": "全部，都"}, {"type": "word", "content": "sports ground", "translation": "操场，运动场"}]}, {"name": "Cartoon Time", "items": [{"type": "dialog", "lines": [{"role": "Sam", "content": "What subject do you like best, Bobby?", "gender": "0", "translation": "Bobby，你最喜欢什么学科？"}, {"role": "Bobby", "content": "I like Music best.", "gender": "0", "translation": "我最喜欢音乐课。"}, {"role": "Sam", "content": "Me too. I also like IT.", "gender": "0", "translation": "我也是。我也喜欢信息科技课。"}, {"role": "Sam", "content": "It's time for IT.", "gender": "0", "translation": "该上信息科技课了。"}, {"role": "Sam", "content": "Let's go!", "gender": "0", "translation": "我们走吧！"}, {"role": "Mrs Fox", "content": "Oh, where's the mouse?", "gender": "0", "translation": "哦，鼠标在哪里？"}, {"role": "Bobby", "content": "Mouse? I'm here!", "gender": "0", "translation": "老鼠？我在这里！"}, {"role": "Student", "content": "Ha ha!", "gender": "0", "translation": "哈哈！"}]}]}, {"name": "Story Time", "items": [{"type": "dialog", "lines": [{"role": "Miss Li", "content": "Welcome back to school, class.", "gender": "0", "translation": "同学们，欢迎回到学校。"}, {"role": "Miss Li", "content": "Look, boys and girls. We have Chinese, Maths, English and Science. We also have Art, PE and Music.", "gender": "0", "translation": "看，同学们。我们有语文、数学、英语和科学。我们还有美术、体育和音乐。"}, {"role": "Mr Green", "content": "I like Maths. I'm good at it. What subject do you like best?", "gender": "0", "translation": "我喜欢数学。我擅长数学。你最喜欢什么学科？"}, {"role": "Liu Tao", "content": "I like Science best. It's interesting.", "gender": "0", "translation": "我最喜欢科学。它很有趣。"}, {"role": "Wang Bing", "content": "I like Chinese best. I want to learn about Chinese culture.", "gender": "0", "translation": "我最喜欢语文。我想学习中国文化。"}, {"role": "Yang Ling", "content": "I like English best. I like reading English stories.", "gender": "0", "translation": "我最喜欢英语。我喜欢读英语故事。"}, {"role": "Miss Li", "content": "It's time for PE.", "gender": "0", "translation": "该上体育课了。"}, {"role": "Students", "content": "We all like PE!", "gender": "0", "translation": "我们都喜欢体育课！"}, {"role": "Students", "content": "Let's go to the sports ground!", "gender": "0", "translation": "我们去操场吧！"}]}]}]}, "2": {"title": "Unit 2 My day", "sections": [{"name": "Lead-in", "items": [{"type": "sent", "content": "Get up now-it's time to go.", "translation": "现在起床，该出发了。"}, {"type": "sent", "content": "Wash your face. Don't be slow.", "translation": "洗洗脸。不要慢吞吞。"}, {"type": "sent", "content": "Check your bag. It's time for school.", "translation": "检查书包。该去上学了。"}, {"type": "sent", "content": "Don't be late! That's the rule.", "translation": "不要迟到！这是规则。"}]}, {"name": "Words", "items": [{"type": "word", "content": "day", "translation": "一天，一日"}, {"type": "word", "content": "get up", "translation": "起床"}, {"type": "word", "content": "wash", "translation": "洗"}, {"type": "word", "content": "face", "translation": "脸，面孔"}, {"type": "word", "content": "have lessons", "translation": "上课"}, {"type": "word", "content": "have", "translation": "吃，喝"}, {"type": "word", "content": "dinner", "translation": "正餐（常指晚餐）"}, {"type": "word", "content": "breakfast", "translation": "早餐，早饭"}, {"type": "word", "content": "lunch", "translation": "午餐，午饭"}, {"type": "word", "content": "go to bed", "translation": "上床睡觉"}, {"type": "word", "content": "o'clock", "translation": "（表示整点）……点钟"}, {"type": "word", "content": "early", "translation": "早的，早"}, {"type": "word", "content": "thirty", "translation": "三十"}, {"type": "word", "content": "first", "translation": "首先，第一"}, {"type": "word", "content": "hurry up", "translation": "快点"}, {"type": "sent", "content": "What time is it?", "translation": "几点了？"}, {"type": "sent", "content": "I'm coming!", "translation": "我来了！"}, {"type": "word", "content": "twenty", "translation": "二十"}, {"type": "sent", "content": "Come on!", "translation": "赶快！加把劲！"}, {"type": "word", "content": "class", "translation": "课，上课"}, {"type": "word", "content": "eleven", "translation": "十一"}, {"type": "word", "content": "sport", "translation": "体育运动"}, {"type": "word", "content": "fifteen", "translation": "十五"}, {"type": "word", "content": "It's time to ...", "translation": "到了……的时间了。"}, {"type": "word", "content": "bed", "translation": "床"}, {"type": "sent", "content": "Good night!", "translation": "晚安！"}]}, {"name": "Cartoon Time", "items": [{"type": "dialog", "lines": [{"role": "Tina", "content": "Bobby, get up!", "gender": "0", "translation": "Bobby，起床！"}, {"role": "Tina", "content": "It's seven o'clock.", "gender": "0", "translation": "七点了。"}, {"role": "Bobby", "content": "It's early.", "gender": "0", "translation": "还早呢。"}, {"role": "Bobby", "content": "Oh no! It's seven thirty!", "gender": "0", "translation": "哦不！七点半了！"}, {"role": "Bobby", "content": "It's time for breakfast.", "gender": "0", "translation": "该吃早餐了。"}, {"role": "Tina", "content": "Wash your face first, Bobby.", "gender": "0", "translation": "Bobby，先洗脸。"}, {"role": "Bobby", "content": "OK.", "gender": "0", "translation": "好的。"}, {"role": "Tina", "content": "Bobby, hurry up!", "gender": "0", "translation": "Bobby，快点！"}, {"role": "Bobby", "content": "What time is it now?", "gender": "0", "translation": "现在几点了？"}, {"role": "Tina", "content": "It's eight!", "gender": "0", "translation": "八点了！"}, {"role": "Bobby", "content": "I'm coming!", "gender": "0", "translation": "我来了！"}]}]}, {"name": "Story Time", "items": [{"type": "dialog", "lines": [{"role": "Wang Bing", "content": "Good morning, Mum. What time is it?", "gender": "0", "translation": "早上好，妈妈。几点了？"}, {"role": "Mum", "content": "Good morning, Bingbing. It's seven twenty. Let's have breakfast.", "gender": "0", "translation": "早上好，冰冰。七点二十了。我们吃早餐吧。"}, {"role": "Mike", "content": "I'm coming.", "gender": "0", "translation": "我来了。"}, {"role": "Wang Bing", "content": "Come on, Mike! It's time for class!", "gender": "0", "translation": "快点，Mike！该上课了！"}, {"role": "Wang Bing", "content": "It's eleven thirty.", "gender": "0", "translation": "十一点半了。"}, {"role": "Liu Jiajia", "content": "Yes, it's lunchtime. Let's go and have lunch.", "gender": "0", "translation": "是的，该吃午饭了。我们去吃午饭吧。"}, {"role": "Wang Bing", "content": "It's four thirty. It's time for sport.", "gender": "0", "translation": "四点半了。该做运动了。"}, {"role": "Liu Tao", "content": "Great! Let's go to the sports ground.", "gender": "0", "translation": "太好了！我们去操场吧。"}, {"role": "Dad", "content": "It's six fifteen. It's time to have dinner.", "gender": "0", "translation": "六点十五分了。该吃晚饭了。"}, {"role": "Wang Bing", "content": "What time is it, Mum?", "gender": "0", "translation": "妈妈，几点了？"}, {"role": "Mum", "content": "It's nine o'clock. It's time for bed.", "gender": "0", "translation": "九点了。该睡觉了。"}, {"role": "Wang Bing", "content": "All right, Mum. Good night!", "gender": "0", "translation": "好的，妈妈。晚安！"}]}]}]}, "3": {"title": "Unit 3 My week", "sections": [{"name": "Lead-in", "items": [{"type": "sent", "content": "Monday, Tuesday, Wednesday,", "translation": "星期一、星期二、星期三，"}, {"type": "sent", "content": "Thursday and then Friday.", "translation": "星期四，然后是星期五。"}, {"type": "sent", "content": "Saturday, Sunday.", "translation": "星期六、星期日。"}, {"type": "sent", "content": "I enjoy every single day.", "translation": "我享受每一天。"}]}, {"name": "Words", "items": [{"type": "word", "content": "week", "translation": "周，星期"}, {"type": "word", "content": "Monday", "translation": "星期一"}, {"type": "word", "content": "Tuesday", "translation": "星期二"}, {"type": "word", "content": "Wednesday", "translation": "星期三"}, {"type": "word", "content": "Thursday", "translation": "星期四"}, {"type": "word", "content": "Friday", "translation": "星期五"}, {"type": "word", "content": "Saturday", "translation": "星期六"}, {"type": "word", "content": "Sunday", "translation": "星期天"}, {"type": "word", "content": "when", "translation": "什么时候"}, {"type": "word", "content": "every", "translation": "每一个，每个"}, {"type": "word", "content": "at", "translation": "在（某时间）"}, {"type": "word", "content": "up", "translation": "起床"}, {"type": "word", "content": "early", "translation": "提早，提前"}, {"type": "word", "content": "today", "translation": "在今天"}, {"type": "sent", "content": "What day is it today?", "translation": "今天星期几？"}, {"type": "word", "content": "cinema", "translation": "电影院"}, {"type": "word", "content": "after school", "translation": "放学后"}, {"type": "word", "content": "dancing", "translation": "跳舞，舞蹈"}, {"type": "word", "content": "lesson", "translation": "一节课，一课时"}, {"type": "word", "content": "walk", "translation": "牵着（动物）走，遛"}, {"type": "word", "content": "dog", "translation": "狗"}, {"type": "word", "content": "tomorrow", "translation": "明天；在明天"}, {"type": "word", "content": "free", "translation": "空闲的"}, {"type": "sent", "content": "See you tomorrow!", "translation": "明天见！"}]}, {"name": "Cartoon Time", "items": [{"type": "dialog", "lines": [{"role": "Bobby", "content": "I can't be late for school again!", "gender": "0", "translation": "我不能再上学迟到了！"}, {"role": "Alarm", "content": "Get up! Get up!", "gender": "0", "translation": "起床！起床！"}, {"role": "Bobby", "content": "It's six thirty!", "gender": "0", "translation": "六点半了！"}, {"role": "Bobby", "content": "Good morning, Mr Wilson. When do you get up every day?", "gender": "0", "translation": "早上好，Wilson 先生。你每天什么时候起床？"}, {"role": "Mr Wilson", "content": "Good morning, Bobby! I get up at five!", "gender": "0", "translation": "早上好，Bobby！我五点起床！"}, {"role": "Mr Wilson", "content": "You're up early today!", "gender": "0", "translation": "你今天起得真早！"}, {"role": "Bobby", "content": "Yes, I want to go to school early.", "gender": "0", "translation": "是的，我想早点去学校。"}, {"role": "Mr Wilson", "content": "School? What day is it today?", "gender": "0", "translation": "学校？今天星期几？"}, {"role": "Bobby", "content": "Oh, it's Saturday!", "gender": "0", "translation": "哦，今天是星期六！"}]}]}, {"name": "Story Time", "items": [{"type": "dialog", "lines": [{"role": "Liu Tao", "content": "It's Friday today. Let's go to the cinema after school.", "gender": "0", "translation": "今天是星期五。放学后我们去电影院吧。"}, {"role": "Yang Ling", "content": "It's a good idea, but I have a dancing lesson today. I have two dancing lessons every week.", "gender": "0", "translation": "这是个好主意，但是我今天有舞蹈课。我每周有两节舞蹈课。"}, {"role": "Liu Tao", "content": "When do you have dancing lessons?", "gender": "0", "translation": "你什么时候上舞蹈课？"}, {"role": "Yang Ling", "content": "On Wednesday and Friday.", "gender": "0", "translation": "在星期三和星期五。"}, {"role": "Liu Tao", "content": "What about you, Mike?", "gender": "0", "translation": "你呢，Mike？"}, {"role": "Mike", "content": "Sorry, I walk my dog on Tuesday and Friday.", "gender": "0", "translation": "抱歉，我星期二和星期五遛狗。"}, {"role": "Wang Bing", "content": "What about tomorrow?", "gender": "0", "translation": "明天怎么样？"}, {"role": "Mike", "content": "OK. I'm free on Saturday.", "gender": "0", "translation": "好的。我星期六有空。"}, {"role": "Yang Ling", "content": "Me too.", "gender": "0", "translation": "我也是。"}, {"role": "Wang Bing", "content": "Great! See you tomorrow!", "gender": "0", "translation": "太好了！明天见！"}]}]}]}, "4": {"title": "Unit 4 I like sport", "sections": [{"name": "Lead-in", "items": [{"type": "sent", "content": "I like running. I like jumping.", "translation": "我喜欢跑步。我喜欢跳跃。"}, {"type": "sent", "content": "Sport is cool. Sport is fun.", "translation": "运动很酷。运动很有趣。"}, {"type": "sent", "content": "I like football. I like swimming.", "translation": "我喜欢足球。我喜欢游泳。"}, {"type": "sent", "content": "Let's keep fit. Run, run, run!", "translation": "让我们保持健康。跑，跑，跑！"}]}, {"name": "Words", "items": [{"type": "word", "content": "play", "translation": "打（球），踢（球）"}, {"type": "word", "content": "football", "translation": "足球运动；足球"}, {"type": "word", "content": "ping-pong", "translation": "乒乓球运动"}, {"type": "word", "content": "basketball", "translation": "篮球运动；篮球"}, {"type": "word", "content": "great", "translation": "非常的"}, {"type": "word", "content": "swimming", "translation": "游泳；游泳运动"}, {"type": "word", "content": "so", "translation": "（表示程度）这么，那么"}, {"type": "word", "content": "well", "translation": "好"}, {"type": "sent", "content": "Have a go!", "translation": "试一试！"}, {"type": "word", "content": "hard", "translation": "难做的，不易的"}, {"type": "word", "content": "It's OK.", "translation": "没关系。"}, {"type": "word", "content": "try", "translation": "试"}, {"type": "sent", "content": "Well played!", "translation": "好球！"}]}, {"name": "Cartoon Time", "items": [{"type": "dialog", "lines": [{"role": "Sam", "content": "I like playing basketball. Do you like playing basketball?", "gender": "0", "translation": "我喜欢打篮球。你喜欢打篮球吗？"}, {"role": "Friend", "content": "Yes, I do.", "gender": "0", "translation": "是的，我喜欢。"}, {"role": "Friend", "content": "Me too.", "gender": "0", "translation": "我也是。"}, {"role": "Sam", "content": "Let's play!", "gender": "0", "translation": "我们玩吧！"}, {"role": "Friend", "content": "Do you like playing basketball?", "gender": "0", "translation": "你喜欢打篮球吗？"}, {"role": "Friend", "content": "Yes, I do.", "gender": "0", "translation": "是的，我喜欢。"}, {"role": "Friend", "content": "Come and play with us!", "gender": "0", "translation": "来和我们一起玩吧！"}, {"role": "Bobby", "content": "OK. Thank you!", "gender": "0", "translation": "好的。谢谢你！"}, {"role": "Friend", "content": "Wow!", "gender": "0", "translation": "哇！"}, {"role": "Bobby", "content": "This is great fun! Can we play again tomorrow?", "gender": "0", "translation": "这太有趣了！我们明天还能再玩吗？"}, {"role": "Friend", "content": "Sure!", "gender": "0", "translation": "当然！"}]}]}, {"name": "Story Time", "items": [{"type": "dialog", "lines": [{"role": "Liu Tao", "content": "I like sport. It's good for us.", "gender": "0", "translation": "我喜欢运动。运动对我们有好处。"}, {"role": "Wang Bing", "content": "Me too. I like swimming and playing ping-pong. What about you?", "gender": "0", "translation": "我也是。我喜欢游泳和打乒乓球。你呢？"}, {"role": "Liu Tao", "content": "I like playing ping-pong too. Let's go and play.", "gender": "0", "translation": "我也喜欢打乒乓球。我们去玩吧。"}, {"role": "Wang Bing", "content": "Good idea!", "gender": "0", "translation": "好主意！"}, {"role": "Wang Bing", "content": "Cool! You play so well!", "gender": "0", "translation": "酷！你打得真好！"}, {"role": "Liu Tao", "content": "Thanks!", "gender": "0", "translation": "谢谢！"}, {"role": "Wang Bing", "content": "Hi, Mike! Do you like playing ping-pong?", "gender": "0", "translation": "嗨，Mike！你喜欢打乒乓球吗？"}, {"role": "Mike", "content": "Yes, I do. Ping-pong is fun. But I can't play well.", "gender": "0", "translation": "是的，我喜欢。乒乓球很有趣。但是我打不好。"}, {"role": "Wang Bing", "content": "Have a go!", "gender": "0", "translation": "试一试！"}, {"role": "Mike", "content": "OK.", "gender": "0", "translation": "好的。"}, {"role": "Mike", "content": "Oh no! It's hard for me.", "gender": "0", "translation": "哦不！这对我来说太难了。"}, {"role": "Wang Bing", "content": "It's OK. Try again.", "gender": "0", "translation": "没关系。再试一次。"}, {"role": "Wang Bing", "content": "Well played!", "gender": "0", "translation": "好球！"}, {"role": "Liu Tao", "content": "Good!", "gender": "0", "translation": "好！"}, {"role": "Mike", "content": "Thank you! Ping-pong is great fun!", "gender": "0", "translation": "谢谢你！乒乓球非常有趣！"}]}]}]}, "5": {"title": "Unit 5 Different toys, same fun", "sections": [{"name": "Lead-in", "items": [{"type": "sent", "content": "Look at the doll. Look at the robot.", "translation": "看这个玩具娃娃。看这个机器人。"}, {"type": "sent", "content": "The doll has long hair.", "translation": "这个玩具娃娃有长头发。"}, {"type": "sent", "content": "The robot has long arms.", "translation": "这个机器人有长胳膊。"}, {"type": "sent", "content": "Different toys, same fun.", "translation": "不同的玩具，同样的乐趣。"}]}, {"name": "Words", "items": [{"type": "word", "content": "different", "translation": "不同的，有区别的"}, {"type": "word", "content": "same", "translation": "相同的，同一的"}, {"type": "word", "content": "hair", "translation": "头发"}, {"type": "word", "content": "eye", "translation": "眼睛"}, {"type": "word", "content": "ear", "translation": "耳朵"}, {"type": "word", "content": "nose", "translation": "鼻子"}, {"type": "word", "content": "mouth", "translation": "嘴，口"}, {"type": "word", "content": "arm", "translation": "手臂"}, {"type": "word", "content": "leg", "translation": "腿"}, {"type": "word", "content": "robot", "translation": "机器人"}, {"type": "word", "content": "his", "translation": "他的"}, {"type": "word", "content": "tall", "translation": "高的"}, {"type": "word", "content": "short", "translation": "短的"}, {"type": "word", "content": "doll", "translation": "玩具娃娃"}, {"type": "word", "content": "her", "translation": "她的"}, {"type": "word", "content": "small", "translation": "小的"}, {"type": "word", "content": "bring", "translation": "带来"}, {"type": "word", "content": "lots of", "translation": "大量，许多"}, {"type": "word", "content": "have", "translation": "组织，举办"}, {"type": "word", "content": "show", "translation": "表演，演出"}]}, {"name": "Cartoon Time", "items": [{"type": "dialog", "lines": [{"role": "Bobby", "content": "These robots are cool!", "gender": "0", "translation": "这些机器人很酷！"}, {"role": "Sam", "content": "Look at this robot. His face is cute.", "gender": "0", "translation": "看这个机器人。他的脸很可爱。"}, {"role": "Robot", "content": "Hello. What's your name?", "gender": "0", "translation": "你好。你叫什么名字？"}, {"role": "Bobby", "content": "I'm Bobby.", "gender": "0", "translation": "我是 Bobby。"}, {"role": "Bobby", "content": "Can you dance?", "gender": "0", "translation": "你会跳舞吗？"}, {"role": "Sam", "content": "Wow! You can talk!", "gender": "0", "translation": "哇！你会说话！"}, {"role": "Robot", "content": "Yes, I can. Look!", "gender": "0", "translation": "是的，我会。看！"}, {"role": "Robot", "content": "I can dance too!", "gender": "0", "translation": "我也会跳舞！"}, {"role": "Sam", "content": "Wow!", "gender": "0", "translation": "哇！"}, {"role": "Sam", "content": "You're so tall! Your legs are long.", "gender": "0", "translation": "你真高！你的腿很长。"}, {"role": "Robot", "content": "Now my legs are short!", "gender": "0", "translation": "现在我的腿短了！"}, {"role": "Sam", "content": "Ha ha! It's great fun.", "gender": "0", "translation": "哈哈！太有趣了。"}]}]}, {"name": "Story Time", "items": [{"type": "dialog", "lines": [{"role": "Su Hai", "content": "Mum, do you like our dolls?", "gender": "0", "translation": "妈妈，你喜欢我们的玩具娃娃吗？"}, {"role": "Mum", "content": "Yes! They're cute.", "gender": "0", "translation": "喜欢！它们很可爱。"}, {"role": "Su Hai", "content": "My doll is a girl. Look at her lovely face. Her eyes are big. Her nose and mouth are small. Her hair is long.", "gender": "0", "translation": "我的玩具娃娃是个女孩。看她可爱的脸。她的眼睛很大。她的鼻子和嘴巴很小。她的头发很长。"}, {"role": "Su Yang", "content": "My doll is a boy. His eyes are small. His nose is small too. But his mouth is big. His arms and legs are long.", "gender": "0", "translation": "我的玩具娃娃是个男孩。他的眼睛很小。他的鼻子也很小。但是他的嘴巴很大。他的胳膊和腿很长。"}, {"role": "Mum", "content": "Your dolls are great. They bring you lots of fun!", "gender": "0", "translation": "你们的玩具娃娃很棒。它们给你们带来很多乐趣！"}, {"role": "Su Hai", "content": "We can have fun together with our friends. Let's have a show!", "gender": "0", "translation": "我们可以和朋友们一起玩得很开心。我们来办一场表演吧！"}, {"role": "Su Yang", "content": "Good idea!", "gender": "0", "translation": "好主意！"}]}]}]}, "6": {"title": "Unit 6 Weather", "sections": [{"name": "Lead-in", "items": [{"type": "sent", "content": "Rain, rain, go away.", "translation": "雨啊，雨啊，快走开。"}, {"type": "sent", "content": "Come again another day.", "translation": "改天再来吧。"}, {"type": "sent", "content": "Little Johnny wants to play.", "translation": "小 Johnny 想要玩耍。"}, {"type": "sent", "content": "Rain, rain, go away.", "translation": "雨啊，雨啊，快走开。"}]}, {"name": "Words", "items": [{"type": "word", "content": "weather", "translation": "天气，气象"}, {"type": "word", "content": "cloudy", "translation": "多云的，阴天的"}, {"type": "word", "content": "sunny", "translation": "晴朗的"}, {"type": "word", "content": "cool", "translation": "凉的，凉爽的"}, {"type": "word", "content": "rainy", "translation": "阴雨的，多雨的"}, {"type": "word", "content": "hot", "translation": "温度高的，热的"}, {"type": "word", "content": "windy", "translation": "多风的，风大的"}, {"type": "word", "content": "warm", "translation": "温暖的，暖和的"}, {"type": "word", "content": "save ... for a rainy day", "translation": "未雨绸缪"}, {"type": "word", "content": "money", "translation": "钱"}, {"type": "sent", "content": "What's the weather like today?", "translation": "今天天气怎么样？"}, {"type": "word", "content": "park", "translation": "公园"}, {"type": "word", "content": "meet", "translation": "（与……）会面，集合"}, {"type": "word", "content": "fly a kite", "translation": "放风筝"}, {"type": "word", "content": "It's raining.", "translation": "下雨了。"}, {"type": "word", "content": "worry", "translation": "担心，担忧"}, {"type": "word", "content": "umbrella", "translation": "伞，雨伞"}, {"type": "word", "content": "there", "translation": "到那里，在那里"}]}, {"name": "Cartoon Time", "items": [{"type": "dialog", "lines": [{"role": "Bobby", "content": "I want a red toy car.", "gender": "0", "translation": "我想要一辆红色玩具汽车。"}, {"role": "Dad", "content": "Bobby, save your money for a rainy day.", "gender": "0", "translation": "Bobby，把钱存起来以备不时之需。"}, {"role": "Bobby", "content": "A rainy day?", "gender": "0", "translation": "下雨天？"}, {"role": "Bobby", "content": "What's the weather like today? Oh, it's sunny and hot.", "gender": "0", "translation": "今天天气怎么样？哦，晴朗又炎热。"}, {"role": "Bobby", "content": "What's the weather like today? Oh, it's cloudy.", "gender": "0", "translation": "今天天气怎么样？哦，多云。"}, {"role": "Bobby", "content": "It's rainy! It's rainy!", "gender": "0", "translation": "下雨了！下雨了！"}, {"role": "Bobby", "content": "Today is a rainy day! It's time to buy the toy car!", "gender": "0", "translation": "今天是下雨天！该买玩具汽车了！"}, {"role": "Dad", "content": "Bobby, ...", "gender": "0", "translation": "Bobby，......"}]}]}, {"name": "Story Time", "items": [{"type": "dialog", "lines": [{"role": "Liu Jiajia", "content": "Hi, Su Hai! Let's go to the park today.", "gender": "0", "translation": "嗨，Su Hai！我们今天去公园吧。"}, {"role": "Su Hai", "content": "Good idea! What's the weather like?", "gender": "0", "translation": "好主意！天气怎么样？"}, {"role": "Liu Jiajia", "content": "It's sunny and warm.", "gender": "0", "translation": "晴朗又温暖。"}, {"role": "Su Hai", "content": "OK. Let's meet at ten.", "gender": "0", "translation": "好的。我们十点见。"}, {"role": "Su Hai", "content": "It's nice here.", "gender": "0", "translation": "这里真好。"}, {"role": "Su Yang", "content": "I like playing outside!", "gender": "0", "translation": "我喜欢在外面玩！"}, {"role": "Liu Jiajia", "content": "It's windy and cloudy now.", "gender": "0", "translation": "现在多风又多云。"}, {"role": "Su Hai", "content": "We can fly a kite.", "gender": "0", "translation": "我们可以放风筝。"}, {"role": "Liu Jiajia", "content": "It's nice and cool now.", "gender": "0", "translation": "现在天气很好，很凉爽。"}, {"role": "Su Hai", "content": "Let's have lunch!", "gender": "0", "translation": "我们吃午饭吧！"}, {"role": "Liu Jiajia", "content": "Oh no! It's raining.", "gender": "0", "translation": "哦不！下雨了。"}, {"role": "Mum", "content": "Don't worry. I have an umbrella with me.", "gender": "0", "translation": "别担心。我带了一把伞。"}, {"role": "Su Hai", "content": "I also have an umbrella. We can share it.", "gender": "0", "translation": "我也有一把伞。我们可以共用它。"}, {"role": "Su Hai", "content": "Let's go and draw pictures there!", "gender": "0", "translation": "我们去那里画画吧！"}, {"role": "Liu Jiajia", "content": "OK!", "gender": "0", "translation": "好的！"}]}]}]}, "7": {"title": "Unit 7 Seasons", "sections": [{"name": "Lead-in", "items": [{"type": "sent", "content": "Spring wind and summer sun.", "translation": "春风和夏日阳光。"}, {"type": "sent", "content": "Autumn leaves and winter snow.", "translation": "秋叶和冬雪。"}, {"type": "sent", "content": "Seasons come and seasons go.", "translation": "季节来来去去。"}, {"type": "sent", "content": "All year long, we have fun.", "translation": "一年到头，我们都很快乐。"}]}, {"name": "Words", "items": [{"type": "word", "content": "season", "translation": "季节"}, {"type": "word", "content": "spring", "translation": "春天，春季"}, {"type": "word", "content": "go boating", "translation": "去划船"}, {"type": "word", "content": "winter", "translation": "冬天，冬季"}, {"type": "word", "content": "go skating", "translation": "去溜冰，去滑冰"}, {"type": "word", "content": "summer", "translation": "夏天，夏季"}, {"type": "word", "content": "ice cream", "translation": "冰激凌"}, {"type": "word", "content": "go swimming", "translation": "去游泳"}, {"type": "word", "content": "autumn", "translation": "秋天，秋季"}, {"type": "word", "content": "go climbing", "translation": "去爬山"}, {"type": "word", "content": "new", "translation": "新的"}, {"type": "word", "content": "cold", "translation": "寒冷的，冷的"}, {"type": "word", "content": "bird", "translation": "鸟"}, {"type": "word", "content": "back", "translation": "回原处"}, {"type": "word", "content": "in", "translation": "在（某段时间）内"}, {"type": "word", "content": "year", "translation": "年"}, {"type": "word", "content": "plant", "translation": "栽种，种植"}, {"type": "word", "content": "pick", "translation": "采，摘"}, {"type": "word", "content": "snow", "translation": "雪，积雪"}]}, {"name": "Cartoon Time", "items": [{"type": "dialog", "lines": [{"role": "Bobby", "content": "It is spring. It is warm.", "gender": "0", "translation": "春天到了。天气温暖。"}, {"role": "Bobby", "content": "Hello! Welcome to my home. We can play together.", "gender": "0", "translation": "你好！欢迎来到我家。我们可以一起玩。"}, {"role": "Bobby", "content": "It is summer. It is hot.", "gender": "0", "translation": "夏天到了。天气炎热。"}, {"role": "Bobby", "content": "Wow, you have babies! And I have new friends!", "gender": "0", "translation": "哇，你们有宝宝了！我也有新朋友了！"}, {"role": "Bobby", "content": "It is autumn. It is cool.", "gender": "0", "translation": "秋天到了。天气凉爽。"}, {"role": "Bobby", "content": "Where are my friends?", "gender": "0", "translation": "我的朋友们在哪里？"}, {"role": "Bobby", "content": "It is winter. It is cold.", "gender": "0", "translation": "冬天到了。天气寒冷。"}, {"role": "Bobby", "content": "Where can they be?", "gender": "0", "translation": "他们会在哪里呢？"}, {"role": "Bobby", "content": "It is spring again. The birds are back.", "gender": "0", "translation": "又是春天了。鸟儿们回来了。"}, {"role": "Bobby", "content": "Nice to see you again!", "gender": "0", "translation": "很高兴再次见到你们！"}]}]}, {"name": "Story Time", "items": [{"type": "dialog", "lines": [{"role": "Narrator", "content": "We have four seasons in a year.", "gender": "0", "translation": "一年有四个季节。"}, {"role": "Narrator", "content": "In spring, it is warm.", "gender": "0", "translation": "春天很温暖。"}, {"role": "Narrator", "content": "We plant trees.", "gender": "0", "translation": "我们植树。"}, {"role": "Narrator", "content": "We go boating.", "gender": "0", "translation": "我们去划船。"}, {"role": "Narrator", "content": "We like spring.", "gender": "0", "translation": "我们喜欢春天。"}, {"role": "Narrator", "content": "In summer, it is hot.", "gender": "0", "translation": "夏天很炎热。"}, {"role": "Narrator", "content": "We eat ice cream.", "gender": "0", "translation": "我们吃冰激凌。"}, {"role": "Narrator", "content": "We go swimming.", "gender": "0", "translation": "我们去游泳。"}, {"role": "Narrator", "content": "We like summer.", "gender": "0", "translation": "我们喜欢夏天。"}, {"role": "Narrator", "content": "In autumn, it is cool.", "gender": "0", "translation": "秋天很凉爽。"}, {"role": "Narrator", "content": "We pick fruit.", "gender": "0", "translation": "我们摘水果。"}, {"role": "Narrator", "content": "We go climbing.", "gender": "0", "translation": "我们去爬山。"}, {"role": "Narrator", "content": "We like autumn.", "gender": "0", "translation": "我们喜欢秋天。"}, {"role": "Narrator", "content": "In winter, it is cold.", "gender": "0", "translation": "冬天很寒冷。"}, {"role": "Narrator", "content": "We play in the snow.", "gender": "0", "translation": "我们在雪地里玩。"}, {"role": "Narrator", "content": "We go skating.", "gender": "0", "translation": "我们去滑冰。"}, {"role": "Narrator", "content": "We like winter.", "gender": "0", "translation": "我们喜欢冬天。"}]}]}]}, "8": {"title": "Unit 8 What we wear", "sections": [{"name": "Lead-in", "items": [{"type": "sent", "content": "We love to dress up on the holiday,", "translation": "我们喜欢在节日里盛装打扮，"}, {"type": "sent", "content": "To celebrate in our own special way.", "translation": "用我们自己的特别方式庆祝。"}, {"type": "sent", "content": "Some wear new dresses or bright skirts.", "translation": "有些人穿新连衣裙或鲜艳的半身裙。"}, {"type": "sent", "content": "Some wear cool caps or nice shirts.", "translation": "有些人戴酷酷的帽子或穿漂亮的衬衫。"}]}, {"name": "Words", "items": [{"type": "word", "content": "wear", "translation": "穿，戴"}, {"type": "word", "content": "cap", "translation": "（尤指有帽舌的）便帽"}, {"type": "word", "content": "coat", "translation": "外套，外衣"}, {"type": "word", "content": "skirt", "translation": "半身裙"}, {"type": "word", "content": "trousers", "translation": "裤子"}, {"type": "word", "content": "dress", "translation": "连衣裙"}, {"type": "word", "content": "shirt", "translation": "（男式）衬衫"}, {"type": "word", "content": "whose", "translation": "谁的"}, {"type": "word", "content": "shorts", "translation": "短裤"}, {"type": "word", "content": "look", "translation": "看来好像，显得"}, {"type": "word", "content": "in", "translation": "穿着，戴着"}, {"type": "word", "content": "sunglasses", "translation": "太阳镜，墨镜"}, {"type": "word", "content": "why", "translation": "为什么"}, {"type": "word", "content": "because", "translation": "因为"}, {"type": "word", "content": "bright", "translation": "聪明的；明亮的"}, {"type": "word", "content": "clothes", "translation": "衣服"}]}, {"name": "Cartoon Time", "items": [{"type": "dialog", "lines": [{"role": "Bobby", "content": "Your trousers are so big. Whose trousers are these?", "gender": "0", "translation": "你的裤子真大。这是谁的裤子？"}, {"role": "Friend", "content": "Ha ha! They're my father's shorts.", "gender": "0", "translation": "哈哈！它们是我爸爸的短裤。"}, {"role": "Bobby", "content": "You look cool in the cap. Whose cap is it?", "gender": "0", "translation": "你戴这顶帽子看起来很酷。这是谁的帽子？"}, {"role": "Sam", "content": "It's my mother's.", "gender": "0", "translation": "是我妈妈的。"}, {"role": "Mrs Fox", "content": "Happy New Year, boys and girls!", "gender": "0", "translation": "新年快乐，孩子们！"}, {"role": "Students", "content": "Happy New Year, Mrs Fox. I like your sunglasses!", "gender": "0", "translation": "新年快乐，Fox 夫人。我喜欢你的太阳镜！"}, {"role": "Mrs Fox", "content": "Thank you! Why do I wear sunglasses today? Guess!", "gender": "0", "translation": "谢谢你们！我今天为什么戴太阳镜？猜一猜！"}, {"role": "Student", "content": "Because they're cool?", "gender": "0", "translation": "因为它们很酷吗？"}, {"role": "Mrs Fox", "content": "Because my students are very bright!", "gender": "0", "translation": "因为我的学生们非常聪明！"}]}]}, {"name": "Story Time", "items": [{"type": "dialog", "lines": [{"role": "Mike", "content": "Hi, Su Hai! Happy Chinese New Year!", "gender": "0", "translation": "嗨，Su Hai！中国新年快乐！"}, {"role": "Su Hai", "content": "Thank you, Mike!", "gender": "0", "translation": "谢谢你，Mike！"}, {"role": "Mike", "content": "Your red dress is beautiful!", "gender": "0", "translation": "你的红裙子很漂亮！"}, {"role": "Su Hai", "content": "Thanks. We like wearing red clothes at Chinese New Year.", "gender": "0", "translation": "谢谢。我们喜欢在中国新年穿红色衣服。"}, {"role": "Su Hai", "content": "Look! This is my father's new shirt. And this is my mother's coat.", "gender": "0", "translation": "看！这是我爸爸的新衬衫。这是我妈妈的外套。"}, {"role": "Mike", "content": "How nice!", "gender": "0", "translation": "真好看！"}, {"role": "Su Hai", "content": "Whose skirt is this? Guess.", "gender": "0", "translation": "这是谁的裙子？猜一猜。"}, {"role": "Mike", "content": "Is it Su Yang's?", "gender": "0", "translation": "它是 Su Yang 的吗？"}, {"role": "Su Hai", "content": "Yes, you're right!", "gender": "0", "translation": "是的，你说对了！"}, {"role": "Mike", "content": "Whose caps are those? They're so cute!", "gender": "0", "translation": "那些是谁的帽子？它们真可爱！"}, {"role": "Su Hai", "content": "They're Kitty's!", "gender": "0", "translation": "它们是 Kitty 的！"}]}]}]}};

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function normalizeSectionName(name) {
    const n = String(name || '').trim();
    if (/^words?$/i.test(n)) return 'Words';
    if (/^cartoon/i.test(n)) return 'Cartoon Time';
    if (/^story/i.test(n)) return 'Story Time';
    return n;
  }

  function getUnitData(unitNum) {
    const unitData = UNITS[String(unitNum)] || UNITS[unitNum];
    if (!unitData) throw new Error('脚本里没有 Unit ' + unitNum + ' 的数据');
    return unitData;
  }

  function getSectionData(unitData, sectionName) {
    const norm = normalizeSectionName(sectionName);
    let section = (unitData.sections || []).find(s => s.name === norm);
    if (!section) {
      section = (unitData.sections || []).find(s => {
        const a = s.name.toLowerCase();
        const b = norm.toLowerCase();
        return a.indexOf(b) === 0 || b.indexOf(a.split(' ')[0]) === 0;
      });
    }
    if (!section || !section.items.length) {
      throw new Error('Unit 数据里没有「' + sectionName + '」内容');
    }
    return section;
  }

  function getTree() {
    const tree = window.zTreeObj || $.fn.zTree.getZTreeObj('treeDemo');
    if (!tree) throw new Error('请先打开课本详情页');
    return tree;
  }

  function getNodeName(node) {
    return node && (node.name || node.oldName || '');
  }

  function findBookNode(tree) {
    const book = tree.getNodesByFilter(
      n => n.type === 'book' && /四上/.test(getNodeName(n)),
      true
    );
    if (!book) throw new Error('找不到“四上”书本节点');
    return book;
  }

  function findUnitNode(unitNum) {
    const tree = getTree();
    const book = findBookNode(tree);
    const title = getUnitData(unitNum).title;
    const unit = tree.getNodesByFilter(
      n =>
        n.type === 'unit' &&
        n.getParentNode &&
        n.getParentNode() &&
        n.getParentNode().id === book.id &&
        (getNodeName(n) === title || new RegExp('^Unit\\s*' + unitNum + '\\b', 'i').test(getNodeName(n))),
      true
    );
    if (!unit) throw new Error('左侧找不到 ' + title + '，请先运行 01-create-units.js');
    return unit;
  }

  function findSectionNode(unitNode, sectionName) {
    const norm = normalizeSectionName(sectionName);
    const kids = unitNode.children || [];
    const section = kids.find(s => s.type === 'section' && normalizeSectionName(getNodeName(s)) === norm);
    if (!section) {
      throw new Error(getNodeName(unitNode) + ' 下找不到 ' + norm + '，请先运行 04-create-sections.js');
    }
    return section;
  }

  function detectFromTree() {
    const tree = getTree();
    const sel = tree.getSelectedNodes();
    if (!sel.length) throw new Error('请先在左侧点选 Words / Cartoon Time / Story Time');
    const node = sel[0];
    if (node.type === 'section') {
      const unit = node.getParentNode();
      const m = getNodeName(unit).match(/Unit\s*(\d+)/i);
      if (!m) throw new Error('无法识别单元：' + getNodeName(unit));
      return { unitNum: Number(m[1]), sectionName: normalizeSectionName(getNodeName(node)) };
    }
    if (node.type === 'unit') {
      const m = getNodeName(node).match(/Unit\s*(\d+)/i);
      if (!m) throw new Error('请点选子章节，不要只点 Unit');
      return { unitNum: Number(m[1]), sectionName: null };
    }
    throw new Error('请点选 Words / Cartoon Time / Story Time 子章节');
  }

  function toBatchItem(item) {
    if (item.type === 'dialog') {
      return {
        type: 'dialog',
        list: (item.lines || []).map(line => ({
          content: line.content,
          role: line.role,
          gender: line.gender || '0',
          translation: line.translation || '',
        })),
      };
    }
    return {
      type: item.type,
      content: item.content,
      translation: item.translation || '',
    };
  }

  function summarizeItems(items) {
    return items.reduce((acc, item) => {
      const key = item.type === 'dialog'
        ? 'dialog(' + (item.lines || []).length + '行)'
        : item.type;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function postBatch(body) {
    return new Promise(resolve => {
      Ajax.post('resources/batch', body, res => resolve(res), res => resolve(res));
    });
  }

  async function importYilinSection(unitNumArg, sectionNameArg) {
    let unitNum = unitNumArg;
    let sectionName = sectionNameArg ? normalizeSectionName(sectionNameArg) : null;
    if (!unitNum || !sectionName) {
      const detected = detectFromTree();
      unitNum = unitNum || detected.unitNum;
      sectionName = sectionName || detected.sectionName;
    }
    if (!sectionName) {
      throw new Error('请指定子章节，或左侧点选 Words / Cartoon Time / Story Time');
    }

    const unitData = getUnitData(unitNum);
    const sectionData = getSectionData(unitData, sectionName);
    const unitNode = findUnitNode(unitNum);
    const sectionNode = findSectionNode(unitNode, sectionName);
    const list = sectionData.items.map(toBatchItem);

    console.log('[import]', unitData.title, '→', sectionName, sectionData.items.length, '条');
    console.table(summarizeItems(sectionData.items));

    const res = await postBatch({
      unitId: unitNode.id,
      sectionId: sectionNode.id,
      list: JSON.stringify(list),
      returnType: 1,
    });
    if (!res || res.result !== 1) {
      throw new Error('导入失败：' + (res && (res.message || res.info) || '未知错误'));
    }
    console.log('[import] OK', unitData.title, '→', sectionName);
    return { unitNum, sectionName, count: sectionData.items.length, response: res };
  }

  async function importYilinUnit(unitNum) {
    const unitData = getUnitData(unitNum);
    const results = [];
    for (const sectionName of SECTION_ORDER) {
      const section = (unitData.sections || []).find(s => s.name === sectionName);
      if (!section || !section.items.length) {
        console.warn('[import] 跳过空章节', unitData.title, '→', sectionName);
        continue;
      }
      results.push(await importYilinSection(unitNum, sectionName));
      await sleep(300);
    }
    console.log('[import] Unit 完成', unitData.title, results.map(r => r.sectionName).join(', '));
    return results;
  }

  async function importYilinBook() {
    const results = [];
    const nums = Object.keys(UNITS).map(Number).sort((a, b) => a - b);
    for (const unitNum of nums) {
      results.push(await importYilinUnit(unitNum));
      await sleep(500);
    }
    console.log('[import] 全册完成', results.length, '个 Unit');
    return results;
  }

  async function previewYilinSection(unitNum, sectionName) {
    const unitData = getUnitData(unitNum);
    const sectionData = getSectionData(unitData, sectionName);
    const list = sectionData.items.map(toBatchItem);
    console.log('[preview]', unitData.title, '→', sectionName);
    console.table(list);
    return list;
  }

  window.importYilinSection = importYilinSection;
  window.importYilinUnit = importYilinUnit;
  window.importYilinBook = importYilinBook;
  window.previewYilinSection = previewYilinSection;
  window.fill = importYilinSection;
  window.fillYilin = importYilinSection;

  console.log('用法: importYilinBook() / importYilinUnit(1) / importYilinSection(1, "Words")');
})();
