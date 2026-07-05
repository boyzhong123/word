/**
 * Step 2: batch upload words then sentences into each unit (sectionId=0)
 * Run AFTER step 1. Paste in same CMS detail page.
 */
(async function uploadYilin4aBatch() {
  const BATCH = [
  {
    "name": "Unit 1 Our school subjects",
    "list": [
      {
        "type": "word",
        "content": "subject",
        "translation": "学科，科目"
      },
      {
        "type": "word",
        "content": "Chinese",
        "translation": "语文（课）；中国的"
      },
      {
        "type": "word",
        "content": "English",
        "translation": "英语（课）；英语的"
      },
      {
        "type": "word",
        "content": "Maths",
        "translation": "数学（课）"
      },
      {
        "type": "word",
        "content": "PE",
        "translation": "体育（课）"
      },
      {
        "type": "word",
        "content": "Art",
        "translation": "美术（课）"
      },
      {
        "type": "word",
        "content": "Science",
        "translation": "科学（课）"
      },
      {
        "type": "word",
        "content": "IT",
        "translation": "信息科技（课）"
      },
      {
        "type": "word",
        "content": "Music",
        "translation": "音乐（课）"
      },
      {
        "type": "word",
        "content": "Labour",
        "translation": "劳动（课）"
      },
      {
        "type": "word",
        "content": "best",
        "translation": "最，最高程度地"
      },
      {
        "type": "word",
        "content": "also",
        "translation": "也"
      },
      {
        "type": "word",
        "content": "It's time for ...",
        "translation": "是……的时候了。"
      },
      {
        "type": "word",
        "content": "mouse",
        "translation": "鼠标；老鼠"
      },
      {
        "type": "word",
        "content": "Welcome back to ...",
        "translation": "欢迎回到……"
      },
      {
        "type": "word",
        "content": "be good at",
        "translation": "擅长"
      },
      {
        "type": "word",
        "content": "interesting",
        "translation": "有趣的，有吸引力的"
      },
      {
        "type": "word",
        "content": "learn about",
        "translation": "学习"
      },
      {
        "type": "word",
        "content": "culture",
        "translation": "文化，文明"
      },
      {
        "type": "word",
        "content": "read",
        "translation": "阅读"
      },
      {
        "type": "word",
        "content": "story",
        "translation": "故事"
      },
      {
        "type": "word",
        "content": "all",
        "translation": "全部，都"
      },
      {
        "type": "word",
        "content": "sports ground",
        "translation": "操场，运动场"
      },
      {
        "type": "sent",
        "content": "What subject do you like best?",
        "translation": "你最喜欢什么学科？"
      },
      {
        "type": "sent",
        "content": "I like Chinese best.",
        "translation": "我最喜欢语文。"
      },
      {
        "type": "sent",
        "content": "I like reading English stories.",
        "translation": "我喜欢读英语故事。"
      },
      {
        "type": "sent",
        "content": "I like Maths. I'm good at it.",
        "translation": "我喜欢数学，我很擅长。"
      },
      {
        "type": "sent",
        "content": "It's time for PE.",
        "translation": "该上体育课了。"
      },
      {
        "type": "sent",
        "content": "We also have Art, PE and Music.",
        "translation": "我们还有美术、体育和音乐课。"
      },
      {
        "type": "sent",
        "content": "Science is interesting.",
        "translation": "科学课很有趣。"
      },
      {
        "type": "sent",
        "content": "I also like IT.",
        "translation": "我也喜欢信息科技课。"
      },
      {
        "type": "sent",
        "content": "I like Music best.",
        "translation": "我最喜欢音乐课。"
      },
      {
        "type": "sent",
        "content": "We have Chinese, Maths, English and Science.",
        "translation": "我们有语文、数学、英语和科学课。"
      },
      {
        "type": "sent",
        "content": "What subject do you like best?",
        "translation": "你最喜欢什么学科？"
      },
      {
        "type": "sent",
        "content": "We also have Art, PE and Music.",
        "translation": "我们还有美术、体育和音乐课。"
      },
      {
        "type": "sent",
        "content": "It's time for PE.",
        "translation": "该上体育课了。"
      },
      {
        "type": "sent",
        "content": "Mouse? I'm here!",
        "translation": "老鼠？我在这儿！"
      },
      {
        "type": "sent",
        "content": "Welcome back to school, class.",
        "translation": "欢迎回到学校，同学们。"
      },
      {
        "type": "sent",
        "content": "I'm good at Maths.",
        "translation": "我擅长数学。"
      },
      {
        "type": "sent",
        "content": "Science is interesting.",
        "translation": "科学课很有趣。"
      },
      {
        "type": "sent",
        "content": "I want to learn about Chinese culture.",
        "translation": "我想了解中国文化。"
      },
      {
        "type": "sent",
        "content": "I want to learn about Chinese culture.",
        "translation": "我想了解中国文化。"
      },
      {
        "type": "sent",
        "content": "I like reading English stories.",
        "translation": "我喜欢读英语故事。"
      },
      {
        "type": "sent",
        "content": "I like reading English stories.",
        "translation": "我喜欢读英语故事。"
      },
      {
        "type": "sent",
        "content": "We all like PE!",
        "translation": "我们都喜欢体育课！"
      },
      {
        "type": "sent",
        "content": "Let's go to the sports ground!",
        "translation": "我们去操场吧！"
      }
    ]
  },
  {
    "name": "Unit 2 My day",
    "list": [
      {
        "type": "word",
        "content": "day",
        "translation": "一天，一日"
      },
      {
        "type": "word",
        "content": "get up",
        "translation": "起床"
      },
      {
        "type": "word",
        "content": "wash",
        "translation": "洗"
      },
      {
        "type": "word",
        "content": "face",
        "translation": "脸，面孔"
      },
      {
        "type": "word",
        "content": "have lessons",
        "translation": "上课"
      },
      {
        "type": "word",
        "content": "have",
        "translation": "吃，喝"
      },
      {
        "type": "word",
        "content": "dinner",
        "translation": "正餐（常指晚餐）"
      },
      {
        "type": "word",
        "content": "breakfast",
        "translation": "早餐，早饭"
      },
      {
        "type": "word",
        "content": "lunch",
        "translation": "午餐，午饭"
      },
      {
        "type": "word",
        "content": "go to bed",
        "translation": "上床睡觉"
      },
      {
        "type": "word",
        "content": "o'clock",
        "translation": "（表示整点）……点钟"
      },
      {
        "type": "word",
        "content": "early",
        "translation": "早的，早"
      },
      {
        "type": "word",
        "content": "thirty",
        "translation": "三十"
      },
      {
        "type": "word",
        "content": "first",
        "translation": "首先，第一"
      },
      {
        "type": "word",
        "content": "hurry up",
        "translation": "快点"
      },
      {
        "type": "word",
        "content": "twenty",
        "translation": "二十"
      },
      {
        "type": "word",
        "content": "class",
        "translation": "课，上课"
      },
      {
        "type": "word",
        "content": "eleven",
        "translation": "十一"
      },
      {
        "type": "word",
        "content": "sport",
        "translation": "体育运动"
      },
      {
        "type": "word",
        "content": "fifteen",
        "translation": "十五"
      },
      {
        "type": "word",
        "content": "It's time to ...",
        "translation": "到了……的时间了。"
      },
      {
        "type": "word",
        "content": "bed",
        "translation": "床"
      },
      {
        "type": "sent",
        "content": "What do you do every day?",
        "translation": "你每天做什么？"
      },
      {
        "type": "sent",
        "content": "Bobby, get up! It's seven o'clock.",
        "translation": "博比，起床！七点了。"
      },
      {
        "type": "sent",
        "content": "Wash your face first, Bobby.",
        "translation": "博比，先洗脸。"
      },
      {
        "type": "sent",
        "content": "Wash your face first, Bobby.",
        "translation": "博比，先洗脸。"
      },
      {
        "type": "sent",
        "content": "We have lessons at school.",
        "translation": "我们在学校上课。"
      },
      {
        "type": "sent",
        "content": "It's time for breakfast.",
        "translation": "该吃早餐了。"
      },
      {
        "type": "sent",
        "content": "We have dinner in the evening.",
        "translation": "我们晚上吃正餐。"
      },
      {
        "type": "sent",
        "content": "It's time for breakfast.",
        "translation": "该吃早餐了。"
      },
      {
        "type": "sent",
        "content": "We have lunch at twelve o'clock.",
        "translation": "我们十二点吃午餐。"
      },
      {
        "type": "sent",
        "content": "I go to bed at nine o'clock.",
        "translation": "我九点上床睡觉。"
      },
      {
        "type": "sent",
        "content": "It's seven o'clock.",
        "translation": "七点了。"
      },
      {
        "type": "sent",
        "content": "It's early.",
        "translation": "还早呢。"
      },
      {
        "type": "sent",
        "content": "It's seven thirty!",
        "translation": "七点半了！"
      },
      {
        "type": "sent",
        "content": "Wash your face first, Bobby.",
        "translation": "博比，先洗脸。"
      },
      {
        "type": "sent",
        "content": "Bobby, hurry up!",
        "translation": "博比，快点！"
      },
      {
        "type": "sent",
        "content": "What time is it?",
        "translation": "几点了？"
      },
      {
        "type": "sent",
        "content": "What time is it now?",
        "translation": "现在几点了？"
      },
      {
        "type": "sent",
        "content": "I'm coming!",
        "translation": "我来了！"
      },
      {
        "type": "sent",
        "content": "I'm coming!",
        "translation": "我来了！"
      },
      {
        "type": "sent",
        "content": "It's twenty past seven.",
        "translation": "七点二十分。"
      },
      {
        "type": "sent",
        "content": "Come on!",
        "translation": "赶快！加把劲！"
      },
      {
        "type": "sent",
        "content": "Come on! Let's go!",
        "translation": "快点！我们走吧！"
      },
      {
        "type": "sent",
        "content": "Welcome back to school, class.",
        "translation": "欢迎回到学校，同学们。"
      },
      {
        "type": "sent",
        "content": "It's eleven o'clock.",
        "translation": "十一点了。"
      },
      {
        "type": "sent",
        "content": "Sport is good for us.",
        "translation": "体育运动对我们有好处。"
      },
      {
        "type": "sent",
        "content": "It's fifteen past eight.",
        "translation": "八点十五分。"
      },
      {
        "type": "sent",
        "content": "Get up now—it's time to go.",
        "translation": "现在起床——该走了。"
      },
      {
        "type": "sent",
        "content": "Bobby is still in bed.",
        "translation": "博比还在床上。"
      },
      {
        "type": "sent",
        "content": "Good night!",
        "translation": "晚安！"
      },
      {
        "type": "sent",
        "content": "Good night, Mum!",
        "translation": "晚安，妈妈！"
      }
    ]
  },
  {
    "name": "Unit 3 My week",
    "list": [
      {
        "type": "word",
        "content": "week",
        "translation": "周，星期"
      },
      {
        "type": "word",
        "content": "Monday",
        "translation": "星期一"
      },
      {
        "type": "word",
        "content": "Tuesday",
        "translation": "星期二"
      },
      {
        "type": "word",
        "content": "Wednesday",
        "translation": "星期三"
      },
      {
        "type": "word",
        "content": "Thursday",
        "translation": "星期四"
      },
      {
        "type": "word",
        "content": "Friday",
        "translation": "星期五"
      },
      {
        "type": "word",
        "content": "Saturday",
        "translation": "星期六"
      },
      {
        "type": "word",
        "content": "Sunday",
        "translation": "星期天"
      },
      {
        "type": "word",
        "content": "when",
        "translation": "什么时候"
      },
      {
        "type": "word",
        "content": "every",
        "translation": "每一个，每个"
      },
      {
        "type": "word",
        "content": "at",
        "translation": "在（某时间）"
      },
      {
        "type": "word",
        "content": "up",
        "translation": "起床"
      },
      {
        "type": "word",
        "content": "early",
        "translation": "提早，提前"
      },
      {
        "type": "word",
        "content": "today",
        "translation": "在今天"
      },
      {
        "type": "word",
        "content": "cinema",
        "translation": "电影院"
      },
      {
        "type": "word",
        "content": "after school",
        "translation": "放学后"
      },
      {
        "type": "word",
        "content": "dancing",
        "translation": "跳舞，舞蹈"
      },
      {
        "type": "word",
        "content": "lesson",
        "translation": "一节课，一课时"
      },
      {
        "type": "word",
        "content": "walk",
        "translation": "牵着（动物）走，遛"
      },
      {
        "type": "word",
        "content": "dog",
        "translation": "狗"
      },
      {
        "type": "word",
        "content": "tomorrow",
        "translation": "明天；在明天"
      },
      {
        "type": "word",
        "content": "free",
        "translation": "空闲的"
      },
      {
        "type": "sent",
        "content": "How do you plan your week?",
        "translation": "你怎么制订一周计划？"
      },
      {
        "type": "sent",
        "content": "I have a dancing lesson on Monday.",
        "translation": "我星期一有舞蹈课。"
      },
      {
        "type": "sent",
        "content": "We go to the cinema on Tuesday.",
        "translation": "我们星期二去电影院。"
      },
      {
        "type": "sent",
        "content": "What do you want to do on Wednesday?",
        "translation": "你星期三想做什么？"
      },
      {
        "type": "sent",
        "content": "I walk my dog on Thursday.",
        "translation": "我星期四遛狗。"
      },
      {
        "type": "sent",
        "content": "It's Friday today.",
        "translation": "今天是星期五。"
      },
      {
        "type": "sent",
        "content": "I am free on Saturday.",
        "translation": "我星期六有空。"
      },
      {
        "type": "sent",
        "content": "We fly a kite on Sunday.",
        "translation": "我们星期天放风筝。"
      },
      {
        "type": "sent",
        "content": "When do you go to the cinema?",
        "translation": "你什么时候去电影院？"
      },
      {
        "type": "sent",
        "content": "What do you do every day?",
        "translation": "你每天做什么？"
      },
      {
        "type": "sent",
        "content": "I go to bed at nine o'clock.",
        "translation": "我九点上床睡觉。"
      },
      {
        "type": "sent",
        "content": "Get up now—it's time to go.",
        "translation": "现在起床——该走了。"
      },
      {
        "type": "sent",
        "content": "I want to go to school early.",
        "translation": "我想早点去学校。"
      },
      {
        "type": "sent",
        "content": "What day is it today?",
        "translation": "今天星期几？"
      },
      {
        "type": "sent",
        "content": "What day is it today?",
        "translation": "今天星期几？"
      },
      {
        "type": "sent",
        "content": "What day is it today?",
        "translation": "今天星期几？"
      },
      {
        "type": "sent",
        "content": "Let's go to the cinema after school.",
        "translation": "放学后我们去看电影吧。"
      },
      {
        "type": "sent",
        "content": "I walk my dog after school.",
        "translation": "我放学后遛狗。"
      },
      {
        "type": "sent",
        "content": "I have a dancing lesson on Monday.",
        "translation": "我星期一有舞蹈课。"
      },
      {
        "type": "sent",
        "content": "I have a dancing lesson on Monday.",
        "translation": "我星期一有舞蹈课。"
      },
      {
        "type": "sent",
        "content": "I walk my dog after school.",
        "translation": "我放学后遛狗。"
      },
      {
        "type": "sent",
        "content": "I walk my dog after school.",
        "translation": "我放学后遛狗。"
      },
      {
        "type": "sent",
        "content": "See you tomorrow!",
        "translation": "明天见！"
      },
      {
        "type": "sent",
        "content": "I am free tomorrow.",
        "translation": "我明天有空。"
      },
      {
        "type": "sent",
        "content": "See you tomorrow!",
        "translation": "明天见！"
      },
      {
        "type": "sent",
        "content": "See you tomorrow!",
        "translation": "明天见！"
      }
    ]
  },
  {
    "name": "Unit 4 I like sport",
    "list": [
      {
        "type": "word",
        "content": "play",
        "translation": "打（球），踢（球）"
      },
      {
        "type": "word",
        "content": "football",
        "translation": "足球运动；足球"
      },
      {
        "type": "word",
        "content": "ping-pong",
        "translation": "乒乓球运动"
      },
      {
        "type": "word",
        "content": "basketball",
        "translation": "篮球运动；篮球"
      },
      {
        "type": "word",
        "content": "great",
        "translation": "非常的"
      },
      {
        "type": "word",
        "content": "swimming",
        "translation": "游泳；游泳运动"
      },
      {
        "type": "word",
        "content": "so",
        "translation": "（表示程度）这么，那么"
      },
      {
        "type": "word",
        "content": "well",
        "translation": "好"
      },
      {
        "type": "word",
        "content": "hard",
        "translation": "难做的，不易的"
      },
      {
        "type": "word",
        "content": "It's OK.",
        "translation": "没关系。"
      },
      {
        "type": "word",
        "content": "try",
        "translation": "试"
      },
      {
        "type": "sent",
        "content": "Let's go and play.",
        "translation": "我们去玩吧。"
      },
      {
        "type": "sent",
        "content": "Do you like playing football?",
        "translation": "你喜欢踢足球吗？"
      },
      {
        "type": "sent",
        "content": "Ping-pong is fun.",
        "translation": "乒乓球很有趣。"
      },
      {
        "type": "sent",
        "content": "I like playing basketball.",
        "translation": "我喜欢打篮球。"
      },
      {
        "type": "sent",
        "content": "You play so well!",
        "translation": "你打得真好！"
      },
      {
        "type": "sent",
        "content": "I like swimming and playing ping-pong.",
        "translation": "我喜欢游泳和打乒乓球。"
      },
      {
        "type": "sent",
        "content": "You play so well!",
        "translation": "你打得真好！"
      },
      {
        "type": "sent",
        "content": "You play so well!",
        "translation": "你打得真好！"
      },
      {
        "type": "sent",
        "content": "Have a go!",
        "translation": "试一试！"
      },
      {
        "type": "sent",
        "content": "Have a go!",
        "translation": "试一试！"
      },
      {
        "type": "sent",
        "content": "Ping-pong is fun, but I can't play well.",
        "translation": "乒乓球很有趣，但我打得不好。"
      },
      {
        "type": "sent",
        "content": "It's OK. Try again.",
        "translation": "没关系，再试一次。"
      },
      {
        "type": "sent",
        "content": "It's OK. Try again.",
        "translation": "没关系，再试一次。"
      },
      {
        "type": "sent",
        "content": "Well played!",
        "translation": "好球！"
      },
      {
        "type": "sent",
        "content": "Well played!",
        "translation": "好球！"
      }
    ]
  },
  {
    "name": "Unit 5 Different toys, same fun",
    "list": [
      {
        "type": "word",
        "content": "different",
        "translation": "不同的，有区别的"
      },
      {
        "type": "word",
        "content": "same",
        "translation": "相同的，同一的"
      },
      {
        "type": "word",
        "content": "hair",
        "translation": "头发"
      },
      {
        "type": "word",
        "content": "eye",
        "translation": "眼睛"
      },
      {
        "type": "word",
        "content": "ear",
        "translation": "耳朵"
      },
      {
        "type": "word",
        "content": "nose",
        "translation": "鼻子"
      },
      {
        "type": "word",
        "content": "mouth",
        "translation": "嘴，口"
      },
      {
        "type": "word",
        "content": "arm",
        "translation": "手臂"
      },
      {
        "type": "word",
        "content": "leg",
        "translation": "腿"
      },
      {
        "type": "word",
        "content": "robot",
        "translation": "机器人"
      },
      {
        "type": "word",
        "content": "his",
        "translation": "他的"
      },
      {
        "type": "word",
        "content": "tall",
        "translation": "高的"
      },
      {
        "type": "word",
        "content": "short",
        "translation": "短的"
      },
      {
        "type": "word",
        "content": "doll",
        "translation": "玩具娃娃"
      },
      {
        "type": "word",
        "content": "her",
        "translation": "她的"
      },
      {
        "type": "word",
        "content": "small",
        "translation": "小的"
      },
      {
        "type": "word",
        "content": "bring",
        "translation": "带来"
      },
      {
        "type": "word",
        "content": "lots of",
        "translation": "大量，许多"
      },
      {
        "type": "word",
        "content": "have",
        "translation": "组织，举办"
      },
      {
        "type": "word",
        "content": "show",
        "translation": "表演，演出"
      },
      {
        "type": "sent",
        "content": "Our toys are different.",
        "translation": "我们的玩具各不相同。"
      },
      {
        "type": "sent",
        "content": "Different toys, same fun.",
        "translation": "玩具不同，乐趣相同。"
      },
      {
        "type": "sent",
        "content": "Her hair is long.",
        "translation": "她的头发很长。"
      },
      {
        "type": "sent",
        "content": "Her eyes are big.",
        "translation": "她的眼睛很大。"
      },
      {
        "type": "sent",
        "content": "The robot has small ears.",
        "translation": "这个机器人耳朵很小。"
      },
      {
        "type": "sent",
        "content": "Her nose is small.",
        "translation": "她的鼻子很小。"
      },
      {
        "type": "sent",
        "content": "Her nose and mouth are small.",
        "translation": "她的鼻子和嘴巴都很小。"
      },
      {
        "type": "sent",
        "content": "His arms are long.",
        "translation": "他的手臂很长。"
      },
      {
        "type": "sent",
        "content": "You're so tall! Your legs are long.",
        "translation": "你真高！你的腿很长。"
      },
      {
        "type": "sent",
        "content": "These robots are cool!",
        "translation": "这些机器人很酷！"
      },
      {
        "type": "sent",
        "content": "His face is lovely.",
        "translation": "他的脸很可爱。"
      },
      {
        "type": "sent",
        "content": "You're so tall!",
        "translation": "你真高！"
      },
      {
        "type": "sent",
        "content": "His legs are long, not short.",
        "translation": "他的腿很长，不短。"
      },
      {
        "type": "sent",
        "content": "Mum, do you like our dolls?",
        "translation": "妈妈，你喜欢我们的娃娃吗？"
      },
      {
        "type": "sent",
        "content": "Look at her lovely face.",
        "translation": "看她可爱的脸。"
      },
      {
        "type": "sent",
        "content": "Her nose and mouth are small.",
        "translation": "她的鼻子和嘴巴都很小。"
      },
      {
        "type": "sent",
        "content": "The toys bring you lots of fun.",
        "translation": "这些玩具给你带来很多乐趣。"
      },
      {
        "type": "sent",
        "content": "The toys bring you lots of fun.",
        "translation": "这些玩具给你带来很多乐趣。"
      },
      {
        "type": "sent",
        "content": "Let's have a puppet show.",
        "translation": "我们来办一场木偶表演吧。"
      },
      {
        "type": "sent",
        "content": "Let's have a puppet show.",
        "translation": "我们来办一场木偶表演吧。"
      }
    ]
  },
  {
    "name": "Unit 6 Weather",
    "list": [
      {
        "type": "word",
        "content": "weather",
        "translation": "天气，气象"
      },
      {
        "type": "word",
        "content": "cloudy",
        "translation": "多云的，阴天的"
      },
      {
        "type": "word",
        "content": "sunny",
        "translation": "晴朗的"
      },
      {
        "type": "word",
        "content": "cool",
        "translation": "凉的，凉爽的"
      },
      {
        "type": "word",
        "content": "rainy",
        "translation": "阴雨的，多雨的"
      },
      {
        "type": "word",
        "content": "hot",
        "translation": "温度高的，热的"
      },
      {
        "type": "word",
        "content": "windy",
        "translation": "多风的，风大的"
      },
      {
        "type": "word",
        "content": "warm",
        "translation": "温暖的，暖和的"
      },
      {
        "type": "word",
        "content": "save ... for a rainy day",
        "translation": "未雨绸缪"
      },
      {
        "type": "word",
        "content": "money",
        "translation": "钱"
      },
      {
        "type": "word",
        "content": "park",
        "translation": "公园"
      },
      {
        "type": "word",
        "content": "meet",
        "translation": "（与……）会面，集合"
      },
      {
        "type": "word",
        "content": "fly a kite",
        "translation": "放风筝"
      },
      {
        "type": "word",
        "content": "It's raining.",
        "translation": "下雨了。"
      },
      {
        "type": "word",
        "content": "worry",
        "translation": "担心，担忧"
      },
      {
        "type": "word",
        "content": "umbrella",
        "translation": "伞，雨伞"
      },
      {
        "type": "word",
        "content": "there",
        "translation": "到那里，在那里"
      },
      {
        "type": "sent",
        "content": "What's the weather like today?",
        "translation": "今天天气怎么样？"
      },
      {
        "type": "sent",
        "content": "On Friday, it is cloudy.",
        "translation": "星期五多云。"
      },
      {
        "type": "sent",
        "content": "On Sunday, it is sunny.",
        "translation": "星期天晴朗。"
      },
      {
        "type": "sent",
        "content": "It is cool today.",
        "translation": "今天很凉爽。"
      },
      {
        "type": "sent",
        "content": "On Saturday, it is rainy.",
        "translation": "星期六下雨。"
      },
      {
        "type": "sent",
        "content": "It is hot in summer.",
        "translation": "夏天很热。"
      },
      {
        "type": "sent",
        "content": "It is windy today.",
        "translation": "今天风很大。"
      },
      {
        "type": "sent",
        "content": "It is warm in spring.",
        "translation": "春天很温暖。"
      },
      {
        "type": "sent",
        "content": "Save your money for a rainy day.",
        "translation": "把钱存起来以备不时之需。"
      },
      {
        "type": "sent",
        "content": "Save your money for a rainy day.",
        "translation": "把钱存起来以备不时之需。"
      },
      {
        "type": "sent",
        "content": "What's the weather like today?",
        "translation": "今天天气怎么样？"
      },
      {
        "type": "sent",
        "content": "What's the weather like today?",
        "translation": "今天天气怎么样？"
      },
      {
        "type": "sent",
        "content": "Let's go to the park.",
        "translation": "我们去公园吧。"
      },
      {
        "type": "sent",
        "content": "Let's meet at the park.",
        "translation": "我们在公园见面吧。"
      },
      {
        "type": "sent",
        "content": "We can fly a kite on a windy day.",
        "translation": "刮风天我们可以放风筝。"
      },
      {
        "type": "sent",
        "content": "It's raining. Take an umbrella.",
        "translation": "下雨了，带把伞。"
      },
      {
        "type": "sent",
        "content": "Don't worry.",
        "translation": "别担心。"
      },
      {
        "type": "sent",
        "content": "Take an umbrella with you.",
        "translation": "你带把伞吧。"
      },
      {
        "type": "sent",
        "content": "Let's meet there.",
        "translation": "我们在那里见面吧。"
      }
    ]
  },
  {
    "name": "Unit 7 Seasons",
    "list": [
      {
        "type": "word",
        "content": "season",
        "translation": "季节"
      },
      {
        "type": "word",
        "content": "spring",
        "translation": "春天，春季"
      },
      {
        "type": "word",
        "content": "go boating",
        "translation": "去划船"
      },
      {
        "type": "word",
        "content": "winter",
        "translation": "冬天，冬季"
      },
      {
        "type": "word",
        "content": "go skating",
        "translation": "去溜冰，去滑冰"
      },
      {
        "type": "word",
        "content": "summer",
        "translation": "夏天，夏季"
      },
      {
        "type": "word",
        "content": "ice cream",
        "translation": "冰激凌"
      },
      {
        "type": "word",
        "content": "go swimming",
        "translation": "去游泳"
      },
      {
        "type": "word",
        "content": "autumn",
        "translation": "秋天，秋季"
      },
      {
        "type": "word",
        "content": "go climbing",
        "translation": "去爬山"
      },
      {
        "type": "word",
        "content": "new",
        "translation": "新的"
      },
      {
        "type": "word",
        "content": "cold",
        "translation": "寒冷的，冷的"
      },
      {
        "type": "word",
        "content": "bird",
        "translation": "鸟"
      },
      {
        "type": "word",
        "content": "back",
        "translation": "回原处"
      },
      {
        "type": "word",
        "content": "in",
        "translation": "在（某段时间）内"
      },
      {
        "type": "word",
        "content": "year",
        "translation": "年"
      },
      {
        "type": "word",
        "content": "plant",
        "translation": "栽种，种植"
      },
      {
        "type": "word",
        "content": "pick",
        "translation": "采，摘"
      },
      {
        "type": "word",
        "content": "snow",
        "translation": "雪，积雪"
      },
      {
        "type": "sent",
        "content": "What do you do in different seasons?",
        "translation": "你在不同季节做什么？"
      },
      {
        "type": "sent",
        "content": "In spring, it is warm.",
        "translation": "春天很温暖。"
      },
      {
        "type": "sent",
        "content": "We go boating in spring.",
        "translation": "春天我们去划船。"
      },
      {
        "type": "sent",
        "content": "It is cold in winter.",
        "translation": "冬天很冷。"
      },
      {
        "type": "sent",
        "content": "We go skating in winter.",
        "translation": "冬天我们去滑冰。"
      },
      {
        "type": "sent",
        "content": "In summer, we eat ice cream.",
        "translation": "夏天我们吃冰激凌。"
      },
      {
        "type": "sent",
        "content": "In summer, we eat ice cream.",
        "translation": "夏天我们吃冰激凌。"
      },
      {
        "type": "sent",
        "content": "We go swimming in summer.",
        "translation": "夏天我们去游泳。"
      },
      {
        "type": "sent",
        "content": "In autumn, it is cool.",
        "translation": "秋天很凉爽。"
      },
      {
        "type": "sent",
        "content": "We go climbing in autumn.",
        "translation": "秋天我们去爬山。"
      },
      {
        "type": "sent",
        "content": "Spring is a new season.",
        "translation": "春天是一个新的季节。"
      },
      {
        "type": "sent",
        "content": "It is cold in winter.",
        "translation": "冬天很冷。"
      },
      {
        "type": "sent",
        "content": "The birds come back in spring.",
        "translation": "鸟儿在春天回来。"
      },
      {
        "type": "sent",
        "content": "The birds come back in spring.",
        "translation": "鸟儿在春天回来。"
      },
      {
        "type": "sent",
        "content": "In spring, we plant trees.",
        "translation": "春天我们种树。"
      },
      {
        "type": "sent",
        "content": "There are four seasons in a year.",
        "translation": "一年有四个季节。"
      },
      {
        "type": "sent",
        "content": "In spring, we plant trees.",
        "translation": "春天我们种树。"
      },
      {
        "type": "sent",
        "content": "In autumn, we pick fruit.",
        "translation": "秋天我们摘果子。"
      },
      {
        "type": "sent",
        "content": "It snows in winter.",
        "translation": "冬天下雪。"
      }
    ]
  },
  {
    "name": "Unit 8 What we wear",
    "list": [
      {
        "type": "word",
        "content": "wear",
        "translation": "穿，戴"
      },
      {
        "type": "word",
        "content": "cap",
        "translation": "（尤指有帽舌的）便帽"
      },
      {
        "type": "word",
        "content": "coat",
        "translation": "外套，外衣"
      },
      {
        "type": "word",
        "content": "skirt",
        "translation": "半身裙"
      },
      {
        "type": "word",
        "content": "trousers",
        "translation": "裤子"
      },
      {
        "type": "word",
        "content": "dress",
        "translation": "连衣裙"
      },
      {
        "type": "word",
        "content": "shirt",
        "translation": "（男式）衬衫"
      },
      {
        "type": "word",
        "content": "whose",
        "translation": "谁的"
      },
      {
        "type": "word",
        "content": "shorts",
        "translation": "短裤"
      },
      {
        "type": "word",
        "content": "look",
        "translation": "看来好像，显得"
      },
      {
        "type": "word",
        "content": "in",
        "translation": "穿着，戴着"
      },
      {
        "type": "word",
        "content": "sunglasses",
        "translation": "太阳镜，墨镜"
      },
      {
        "type": "word",
        "content": "why",
        "translation": "为什么"
      },
      {
        "type": "word",
        "content": "because",
        "translation": "因为"
      },
      {
        "type": "word",
        "content": "bright",
        "translation": "聪明的；明亮的"
      },
      {
        "type": "word",
        "content": "clothes",
        "translation": "衣服"
      },
      {
        "type": "sent",
        "content": "What do you wear for special days?",
        "translation": "特殊日子里你穿什么？"
      },
      {
        "type": "sent",
        "content": "You look cool in the cap.",
        "translation": "你戴这顶帽子看起来很酷。"
      },
      {
        "type": "sent",
        "content": "This is my mother's coat.",
        "translation": "这是我妈妈的外套。"
      },
      {
        "type": "sent",
        "content": "She wears a new skirt.",
        "translation": "她穿了一条新半身裙。"
      },
      {
        "type": "sent",
        "content": "Whose trousers are these?",
        "translation": "这是谁的裤子？"
      },
      {
        "type": "sent",
        "content": "She wears a red dress.",
        "translation": "她穿了一条红色连衣裙。"
      },
      {
        "type": "sent",
        "content": "This is my father's new shirt.",
        "translation": "这是我爸爸的新衬衫。"
      },
      {
        "type": "sent",
        "content": "Whose cap is it?",
        "translation": "它是谁的帽子？"
      },
      {
        "type": "sent",
        "content": "Whose shorts are these?",
        "translation": "这是谁的短裤？"
      },
      {
        "type": "sent",
        "content": "You look cool in the cap.",
        "translation": "你戴这顶帽子看起来很酷。"
      },
      {
        "type": "sent",
        "content": "You look cool in the cap.",
        "translation": "你戴这顶帽子看起来很酷。"
      },
      {
        "type": "sent",
        "content": "I wear sunglasses because they're cool.",
        "translation": "我戴太阳镜因为它很酷。"
      },
      {
        "type": "sent",
        "content": "Why do I wear sunglasses today?",
        "translation": "我今天为什么戴太阳镜？"
      },
      {
        "type": "sent",
        "content": "I wear sunglasses because they're cool.",
        "translation": "我戴太阳镜因为它很酷。"
      },
      {
        "type": "sent",
        "content": "My students are very bright!",
        "translation": "我的学生们非常聪明！"
      },
      {
        "type": "sent",
        "content": "What clothes do you wear?",
        "translation": "你穿什么衣服？"
      }
    ]
  }
];
  const tree = window.zTreeObj || $.fn.zTree.getZTreeObj('treeDemo');
  if (!tree) return console.error('open detail page first');

  const book = tree.getNodesByFilter(
    n => n.type === 'book' && /四上/.test(n.name || n.oldName || ''),
    true
  );
  if (!book) return console.error('四上 book not found');

  const postBatch = body =>
    new Promise(resolve => Ajax.post('resources/batch', body, resolve));

  for (const unitData of BATCH) {
    const unit = tree.getNodesByFilter(
      n =>
        n.type === 'unit' &&
        n.getParentNode()?.id === book.id &&
        (n.name === unitData.name || n.oldName === unitData.name),
      true
    );
    if (!unit) {
      console.error('unit not found', unitData.name);
      continue;
    }

    console.log('uploading', unitData.name, unitData.list.length, 'items...');
    const res = await postBatch({
      unitId: unit.id,
      sectionId: 0,
      list: unitData.list,
    });
    if (res.result === 1) {
      console.log('ok', unitData.name);
    } else {
      console.error('fail', unitData.name, res.message || res);
    }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log('all done — click Unit 1 to verify 单词/句子 tabs');
})();
