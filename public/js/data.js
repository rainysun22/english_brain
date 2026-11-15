/* ENGLISH BRAIN // static course data
 * All Chinese explanations are distilled from 课程讲义-Building-Your-English-Brain.
 * Source course: Luke Priddy / Cloud English.
 */

export const SITE = {
  name: "ENGLISH BRAIN",
  zh: "英语大脑训练场",
  tagline: "DON'T TRANSLATE. THINK.",
  course: "Building Your English Brain",
  teacher: "Luke Priddy / Cloud English",
  dictApi: "https://api.dictionaryapi.dev/api/v2/entries/en/",
  vocab: "https://www.vocabulary.com/dictionary/",
  version: "1.0.0",
};

export const METHODS = [
  {
    id: "reading", no: "01", title: "语境猜词", en: "CONTEXT GUESS", source: "CONTEXT", minutes: 15,
    color: "green", icon: "book", group: "input", output: "猜词本",
    desc: "",
    why: "先根据上下文猜，再查英英释义，最后回到原句验证。",
    path: "#/lab/reading",
  },
  {
    id: "idioms", no: "02", title: "习语体会", en: "IDIOM SENSE", source: "IDIOMS", minutes: 8,
    color: "pink", icon: "chat", group: "input", output: "三问笔记",
    desc: "",
    why: "学习语的第一价值是听懂，不是马上拿来用。用错场合，越“地道”越别扭。",
    path: "#/lab/idioms",
  },
  {
    id: "four-word", no: "03", title: "四词练习", en: "FOUR-WORD", source: "OUTPUT", minutes: 15,
    color: "orange", icon: "dice", group: "output", output: "每日 2–4 句",
    desc: "",
    why: "它不可能用翻译完成。四词必须直接在英语里组合，每次练习都是一次英语脑实战。",
    path: "#/lab/four-word",
  },
  {
    id: "variations", no: "04", title: "句式变化", en: "VARIATIONS", source: "OUTPUT", minutes: 10,
    color: "cyan", icon: "shuffle", group: "output", output: "5 个变体",
    desc: "",
    why: "变体改的是说法，不是信息。只把词挪个位置，不算练习。",
    path: "#/lab/variations",
  },
  {
    id: "full-variations", no: "05", title: "段落变化", en: "FULL VARIATIONS", source: "OUTPUT", minutes: 20,
    color: "purple", icon: "paragraph", group: "output", output: "4–6 句重写",
    desc: "",
    why: "保留事实，丢掉措辞。两段读完，脑子里应该是同一个故事。",
    path: "#/lab/full-variations",
  },
  {
    id: "dictation", no: "06", title: "听写循环", en: "DICTATION LOOP", source: "LISTENING", minutes: 20,
    color: "blue", icon: "headphones", group: "scene", output: "一段听写稿",
    desc: "",
    why: "第一遍听懂 20–30% 才对。如果太简单，说明材料选错了。",
    path: "#/lab/dictation",
  },
  {
    id: "description", no: "07", title: "描述练习", en: "DESCRIPTION", source: "SPEAKING", minutes: 0,
    color: "yellow", icon: "eye", group: "scene", output: "一段描述",
    desc: "",
    why: "英语不能只在书里，得常驻在脑子里。无聊时、等车时都能做。",
    path: "#/lab/description",
  },
  {
    id: "writing", no: "08", title: "写作训练", en: "WRITING", source: "WRITING", minutes: 0,
    color: "pink", icon: "pen", group: "output", output: "一篇草稿",
    desc: "",
    why: "写作、思考、口语基本是同一项技能。写作只是唯一可以回头修改的那一版。",
    path: "#/lab/writing",
  },

];

export const READINGS = [
  {
    id: "wine",
    title: "RED WINE",
    zh: "红酒与地区",
    source: "精读例句",
    text: "While red wine is produced in many different regions around the world, each of these regions shares common features.",
    translation: "虽然红葡萄酒在世界许多不同地区生产，但这些地区都有共同特征。",
    words: [
      { w: "produced", base: "produce", clue: "to produce ≈ to make。注意 in many regions 说明它是在不同地方“被做出来”。", en: "to make or grow something, especially in large quantities", zh: "生产；出产", example: "The region produces some of the best wine in the country." },
      { w: "regions", base: "region", clue: "in + 地点；many different + around the world。它比 factory 大得多，是“地区”。", en: "a large area of land, or an area that is different from others", zh: "地区；区域", example: "This plant grows in tropical regions." },
      { w: "common", base: "common", clue: "each of these regions shares ___ features = 它们都有一些相同的特点。", en: "shared by two or more people or things", zh: "共同的；常见的", example: "We have something in common: we both like animations." },
      { w: "features", base: "feature", clue: "句子的主语是 regions，shares 后面接的是地区具备的“特点”。", en: "an important part or quality of something", zh: "特征；特点", example: "The house has many original features." },
    ],
  },
  {
    id: "adele",
    title: "ADELE COMES HOME",
    zh: "Adele 回家",
    source: "改写练习原文",
    text: "Adele had been living on the West Coast in California for about six years. So when she finally decided to come home, there was a huge reception party. It seemed strange to her that even though so much time had passed, nothing much had changed. The old house looked the same. And so did her family. She spent a week catching up, visiting relatives before going back to California.",
    translation: "Adele 在加州西海岸住了大约六年。当她终于决定回家时，家人办了一场盛大的欢迎聚会。让她觉得奇怪的是，尽管过了这么久，几乎什么都没变。老房子还是原样，家人也一样。她花了一周和亲戚叙旧，然后回到加州。",
    words: [
      { w: "reception", base: "reception", clue: "a huge ___ party，为了迎接她而办的聚会。reception 也有“接待”的意思。", en: "a formal party to welcome someone", zh: "欢迎会；接待", example: "They held a reception for the new teacher." },
      { w: "catching up", base: "catch up", clue: "spent a week ___ with relatives，六年没见，先要互相讲讲这些年的事。", en: "to talk with someone you have not seen for a while and exchange news", zh: "叙旧；赶上", example: "Let's meet for coffee and catch up." },
      { w: "relatives", base: "relative", clue: "visiting ___，和 family 有关但范围更广：叔伯、表亲、祖父母。", en: "members of your family, especially those who are not your parents or children", zh: "亲戚", example: "She visited relatives in the countryside." },
      { w: "extended family", base: "extended family", clue: "讲义补充词：不是父母子女组成的 immediate family，而是把亲戚都算进来的家庭。", en: "a family that includes grandparents, aunts, uncles and cousins", zh: "扩大家庭；亲戚", example: "Holidays are a time for the extended family to get together." },
    ],
  },
  {
    id: "education",
    title: "THE EDUCATION PROBLEM",
    zh: "教育体系的问题",
    source: "听力材料",
    text: "The dire American education system has spawned a wide range of proposals and half-baked solutions. The core of the problem, according to most, is a test-oriented system which has become increasingly narrow and stringent in recent years.",
    translation: "糟糕的美国教育体系催生了各种各样的提案和半生不熟的方案。在多数人看来，问题的核心是应试导向的制度——近年来它变得越来越狭窄、越来越严苛。",
    words: [
      { w: "dire", base: "dire", clue: "形容美国教育体系，后面接 problems / consequences 也很常见，比 bad 严重。", en: "very serious or terrible", zh: "严峻的；糟糕的", example: "The company is in dire need of money." },
      { w: "spawned", base: "spawn", clue: "problem ___ proposals = 问题“催生”了一堆提案。", en: "to cause something to start existing", zh: "催生；引发", example: "The film spawned a series of sequels." },
      { w: "half-baked", base: "half-baked", clue: "half + baked，没烤熟的方案 = 不成熟、欠考虑的点子。", en: "not carefully planned or thought through", zh: "半生不熟的；欠考虑的", example: "It was another half-baked idea." },
      { w: "stringent", base: "stringent", clue: "并列 narrow and ___，形容规则、标准越来越紧。", en: "very strict and difficult to follow", zh: "严格的；严苛的", example: "The city introduced stringent new rules." },
    ],
  },
];

export const WORD_BANK = [
  {
    word: "produce", ipa: "/prəˈduːs/", zh: "生产；出产", core: "to make or grow something",
    forms: [
      { form: "produce", pos: "v.", def: "生产、出产", example: "The region produces excellent wine." },
      { form: "producer", pos: "n.", def: "生产者；制片人", example: "The producer funded the entire film." },
      { form: "product", pos: "n.", def: "产品", example: "This product sells well in Europe." },
      { form: "production", pos: "n.", def: "生产；制作", example: "Production at the factory has doubled." },
      { form: "productive", pos: "adj.", def: "高效的；多产的", example: "It was a productive morning." },
    ],
    collocations: ["produce red wine", "produce a movie", "mass production"],
  },
  {
    word: "correlation", ipa: "/ˌkɒrəˈleɪʃn/", zh: "关联；相关性", core: "a connection between two or more things",
    forms: [
      { form: "correlation", pos: "n.", def: "关联、相关性", example: "There is a direct correlation between income and health." },
      { form: "correlate", pos: "v.", def: "相互关联", example: "Income does not always correlate with happiness." },
      { form: "correlated", pos: "adj.", def: "相关的", example: "The two events are clearly correlated." },
      { form: "correlational", pos: "adj.", def: "相关性的（学术）", example: "The study used a correlational design." },
    ],
    collocations: ["a correlation between A and B", "be correlated with", "positively correlated"],
  },
  {
    word: "stable", ipa: "/ˈsteɪbl/", zh: "稳定的；马厩", core: "not likely to move, change or fail",
    forms: [
      { form: "stable", pos: "adj. / n.", def: "稳定的；马厩", example: "He comes across as a stable person." },
      { form: "stabilize", pos: "v.", def: "使稳定", example: "The government tried to stabilize prices." },
      { form: "stability", pos: "n.", def: "稳定性", example: "Economic stability matters to everyone." },
      { form: "unstable", pos: "adj.", def: "不稳定的", example: "The ladder felt unstable." },
    ],
    collocations: ["a stable person", "stable prices", "prehistoric stables"],
  },
  {
    word: "stick", ipa: "/stɪk/", zh: "粘贴；棍子；坚持", core: "to attach something, or continue doing something",
    forms: [
      { form: "stick", pos: "v. / n.", def: "粘贴；坚持；棍子", example: "Stick to your plans." },
      { form: "sticky", pos: "adj.", def: "黏的；棘手的", example: "The floor was sticky with juice." },
      { form: "stuck", pos: "adj.", def: "卡住的；被困住的", example: "We were stuck in traffic." },
      { form: "sticker", pos: "n.", def: "贴纸", example: "She put a sticker on her laptop." },
    ],
    collocations: ["stick to your plans", "stick in your mind", "a common stick"],
  },
  {
    word: "common", ipa: "/ˈkɒmən/", zh: "常见的；共同的", core: "happening often, or shared by people",
    forms: [
      { form: "common", pos: "adj.", def: "常见的；共同的", example: "We have something in common." },
      { form: "commonly", pos: "adv.", def: "通常；普遍地", example: "This word is commonly used in business." },
      { form: "uncommon", pos: "adj.", def: "不常见的", example: "It is uncommon to see snow here." },
      { form: "commoner", pos: "n.", def: "平民", example: "In the story, a commoner becomes king." },
    ],
    collocations: ["as a general rule", "in common", "common features"],
  },
  {
    word: "sign", ipa: "/saɪn/", zh: "标志；签名；迹象", core: "a mark or action that shows something",
    forms: [
      { form: "sign", pos: "n. / v.", def: "标志；迹象；签名", example: "At the first sign of trouble, they left." },
      { form: "signal", pos: "n. / v.", def: "信号；示意", example: "The phone signal was weak." },
      { form: "signature", pos: "n.", def: "签名", example: "The contract needs your signature." },
      { form: "significant", pos: "adj.", def: "重要的；显著的", example: "There was a significant improvement." },
    ],
    collocations: ["at the first sign of", "sign your name", "a significant change"],
  },
  {
    word: "ship", ipa: "/ʃɪp/", zh: "船；运送", core: "to send goods somewhere, or a large boat",
    forms: [
      { form: "ship", pos: "n. / v.", def: "船；运送", example: "We shipped off to America." },
      { form: "shipment", pos: "n.", def: "货物；装运", example: "The shipment arrived on Monday." },
      { form: "shipping", pos: "n.", def: "航运；运费", example: "Shipping is free for members." },
      { form: "shipper", pos: "n.", def: "托运人；发货方", example: "The shipper packed everything carefully." },
    ],
    collocations: ["ship off", "shipping company", "beneath a certain weight"],
  },
  {
    word: "strange", ipa: "/streɪndʒ/", zh: "奇怪的；陌生的", core: "unusual or surprising, and often hard to explain",
    forms: [
      { form: "strange", pos: "adj.", def: "奇怪的；陌生的", example: "There was a strange marking on the door." },
      { form: "strangely", pos: "adv.", def: "奇怪地", example: "Strangely, nobody noticed." },
      { form: "stranger", pos: "n.", def: "陌生人", example: "Never get into a car with a stranger." },
      { form: "strangeness", pos: "n.", def: "奇怪之处", example: "She noticed the strangeness of the silence." },
    ],
    collocations: ["something strange going on", "a strange feeling", "strangely familiar"],
  },
  {
    word: "learn", ipa: "/lɜːn/", zh: "学习；得知", core: "to gain knowledge or skill",
    forms: [
      { form: "learn", pos: "v.", def: "学习；得知", example: "We learn new words in context." },
      { form: "learning", pos: "n.", def: "学习；学问", example: "Learning a language takes time." },
      { form: "learned", pos: "adj.", def: "有学问的；习得的", example: "He is a learned man." },
      { form: "learner", pos: "n.", def: "学习者", example: "Every learner makes mistakes." },
    ],
    collocations: ["learn in context", "a quick learner", "learning by doing"],
  },
  {
    word: "unique", ipa: "/juˈniːk/", zh: "独一无二的；独特的", core: "being the only one of its kind",
    forms: [
      { form: "unique", pos: "adj.", def: "独特的；唯一的", example: "Your accent is unique." },
      { form: "uniquely", pos: "adv.", def: "独特地", example: "The city is uniquely positioned." },
      { form: "uniqueness", pos: "n.", def: "独特性", example: "The uniqueness of the design is its charm." },
    ],
    collocations: ["one in a million", "a unique opportunity", "sound unique"],
  },
  {
    word: "vary", ipa: "/ˈveəri/", zh: "变化；不同", core: "to change or be different",
    forms: [
      { form: "vary", pos: "v.", def: "变化；不同", example: "Prices vary from store to store." },
      { form: "varied", pos: "adj.", def: "多样的；变化的", example: "The course offers a varied schedule." },
      { form: "various", pos: "adj.", def: "各种各样的", example: "We tried various approaches." },
      { form: "variety", pos: "n.", def: "多样性；种类", example: "A variety of methods can work." },
    ],
    collocations: ["vary from … to …", "a variety of", "for various reasons"],
  },
  {
    word: "immerse", ipa: "/ɪˈmɜːs/", zh: "使沉浸；浸入", core: "to put yourself completely into an activity or environment",
    forms: [
      { form: "immerse", pos: "v.", def: "使沉浸", example: "Immerse yourself in English every day." },
      { form: "immersed", pos: "adj.", def: "沉浸其中的", example: "She was completely immersed in the book." },
      { form: "immersion", pos: "n.", def: "沉浸", example: "Language immersion speeds up learning." },
    ],
    collocations: ["immerse yourself in", "language immersion", "total immersion"],
  },
];

export const IDIOMS = [
  {
    id: "over-the-top", idiom: "over the top", zh: "太过；超过分寸", literal: "越过顶端",
    meaning: "too much; more than is appropriate or necessary",
    connotation: "评价穿着、装饰、反应超出场合需要。可以开玩笑，也可能是批评。",
    scene: "有人穿三件套燕尾服去普通求职面试。",
    example: "That suit is a bit over the top for an interview.",
    useIt: "朋友穿得夸张去派对，可以笑着说；对上级的正式方案，慎用。",
    level: 1,
  },
  {
    id: "one-in-a-million", idiom: "one in a million", zh: "万里挑一；非常珍贵", literal: "一百万分之一",
    meaning: "extremely special, rare, or precious to the speaker",
    connotation: "强调“在非常多的人里，你对我而言特别”，带主观感情；不是统计数字。",
    scene: "对亲近的人表达珍视：My wife is one in a million.",
    example: "My grandmother is one in a million.",
    useIt: "对家人、伴侣、好友说；评价口音、作品时可能显得牵强。",
    level: 2,
  },
  {
    id: "pick-up-on", idiom: "pick up on", zh: "注意到；察觉到", literal: "从上面捡起来",
    meaning: "to notice something that is not very obvious",
    connotation: "常指从别人的话、语气、场景里捕捉到细节或暗示。",
    scene: "你听出对方话里有话，或者注意到一个很小的文化细节。",
    example: "She picked up on the tension in the room immediately.",
    useIt: "日常对话、观察类描述都自然；正式报告里可换成 notice。",
    level: 2,
  },
  {
    id: "come-across-as", idiom: "come across as", zh: "给人……的印象", literal: "走过来像……",
    meaning: "to give other people a particular impression",
    connotation: "评价别人（或自己）呈现出来的感觉，不一定是真实性格。",
    scene: "坚持计划会让别人觉得你可靠：come across as a stable person.",
    example: "He comes across as confident, but he is actually shy.",
    useIt: "谈印象、面试反馈、社交观察；后接形容词或名词。",
    level: 2,
  },
  {
    id: "beneath-notice", idiom: "beneath someone's notice", zh: "没引起某人注意；不值得理会", literal: "在某人的注意之下",
    meaning: "too unimportant for someone to notice",
    connotation: "既可客观说“没被注意到”，也可能暗示某人自视甚高。",
    scene: "他们悄悄离开，没让任何人注意到：escaped beneath anyone's notice.",
    example: "The mistake went beneath everyone's notice.",
    useIt: "书面、叙事里更常见；口语里说 nobody noticed 更直接。",
    level: 3,
  },
  {
    id: "catch-up", idiom: "catch up", zh: "叙旧；赶上", literal: "追上",
    meaning: "to talk with someone after a long time, or to reach the same level",
    connotation: "和朋友叙旧很自然；说 catch up on work 是“补上进度”。",
    scene: "Adele 六年没回家，花一周和亲戚 catch up。",
    example: "Let's grab coffee and catch up sometime.",
    useIt: "朋友、同事都合适；catch up with 后面接人，catch up on 后面接事情。",
    level: 1,
  },
  {
    id: "mental-note", idiom: "make a mental note", zh: "心里记下；暗记", literal: "做一张脑内的便条",
    meaning: "to remember something without writing it down",
    connotation: "强调“没有写下来，但我记住了”，常带一点郑重。",
    scene: "Adele 告诉自己很快会再回来：made a mental note.",
    example: "I made a mental note to call her later.",
    useIt: "叙事、日常都自然；正式写作里也可用。",
    level: 2,
  },
  {
    id: "not-how-language-works", idiom: "That's not how language works.", zh: "语言不是这么运作的。", literal: "语言不是这样工作的",
    meaning: "used to reject a mechanical, one-to-one view of language",
    connotation: "不是习语，而是一句立场鲜明的评价；适合反驳“背对应词就能用”的想法。",
    scene: "有人把习语当高级同义词，按对照表每句塞一个。",
    example: "You can't just swap words one for one — that's not how language works.",
    useIt: "讨论学习方法时用；别对正在努力的人说得太冲。",
    level: 2,
  },
];

export const VARIATION_SETS = [
  {
    id: "tickets",
    source: "VARIATION SET",
    original: "I think it might take a few days for me to help you book your tickets.",
    zh: "我想，我帮你订票可能需要几天。",
    info: "说话人已经答应帮忙；不确定的是需要多久。",
    target: 5,
    builtIn: [
      { text: "I think I can have your tickets booked in a few days.", note: "换成 have something done，语气更干脆；I think + might 的双重不确定被拿掉。" },
      { text: "Give me a few days to book your tickets.", note: "从“告知”变成“请求”，语气偏硬，像 demand，少了礼貌。" },
      { text: "I can reserve your tickets if you like, but it might take me a few days.", note: "从“承诺”变成“提议”：你让我做，我才做。" },
      { text: "If you give me a few days, I can book your tickets.", note: "条件句，先条件后结果；同样只是提议，不是承诺。" },
    ],
  },
  {
    id: "factory",
    source: "综合练习 · 城市改造",
    original: "The city has decided to turn the old factory into a public library.",
    zh: "市政府已决定把旧工厂改造成公共图书馆。",
    info: "决定已经做出；改造方向确定；时间是未来。",
    target: 4,
    builtIn: [
      { text: "It has been decided that the old factory will become a public library.", note: "被动语态 + 形式主语，更像新闻稿。" },
      { text: "The old factory is going to be turned into a public library by the city.", note: "被动语态，重点从 city 移到 factory。" },
      { text: "The city plans to convert the old factory into a public library.", note: "convert 更正式；plans to 比 has decided to 少一点“已定”的意味。" },
    ],
  },
  {
    id: "reading",
    source: "综合练习 · 学习方法",
    original: "I think reading every day is the best way to build an English brain.",
    zh: "我认为每天阅读是建立英语大脑的最佳方式。",
    info: "这是说话人的主观判断；阅读是手段；目标是英语脑。",
    target: 4,
    builtIn: [
      { text: "In my opinion, nothing builds an English brain better than reading every day.", note: "比较级 + nothing ... better，语气更强。" },
      { text: "Daily reading is, I believe, the most effective way to train an English brain.", note: "插入语 I believe，书面、克制。" },
      { text: "If you want to build an English brain, reading every day is your best bet.", note: "条件句 + best bet，口语化，提议感更强。" },
    ],
  },
];

export const FULL_PARAGRAPHS = [
  {
    id: "adele",
    title: "ADELE COMES HOME",
    source: "PARAGRAPH REWRITE",
    original: "Adele had been living on the West Coast in California for about six years. So when she finally decided to come home, there was a huge reception party. It seemed strange to her that even though so much time had passed, nothing much had changed. The old house looked the same. And so did her family. She spent a week catching up, visiting relatives before going back to California. She told herself she wouldn't let another six years pass before seeing them again.",
    zh: "Adele 在加州西海岸住了大约六年。当她终于决定回家时，家人办了一场盛大的欢迎聚会。让她觉得奇怪的是，尽管过了这么久，几乎什么都没变。老房子还是原样，家人也一样。她花了一周和亲戚叙旧，然后回到加州。她告诉自己，不会再让六年过去才见他们一面。",
    model: "Six years had passed in California since Adele had last seen her family. And at last she decided to go home for a visit. She was totally shocked when she got there: her whole family had a gathering to welcome her. Surprisingly, everything seemed unchanged. After a week seeing extended family, she headed back to the West Coast and made a mental note that she would soon go back for a visit.",
    facts: [
      "The main character is Adele.",
      "She lived in California on the West Coast for about six years.",
      "She decided to go home to see her family.",
      "Her family held a welcome party for her.",
      "She found that almost nothing had changed.",
      "The old house and her family looked the same.",
      "She stayed for a week and caught up with relatives.",
      "She returned to California and planned to come back sooner.",
    ],
    swaps: ["reception → a gathering to welcome her", "looked the same → seemed unchanged", "told herself → made a mental note", "went back → headed back"],
  },
  {
    id: "routine",
    title: "A DAILY ROUTINE",
    source: "DAILY ROUTINE",
    original: "In the morning, write for ten minutes. Then do the four-word exercise or variations for another ten minutes. On the way to work, listen to a one-minute audio clip and write down every word you hear. At night, read for twenty minutes and learn new words in context. When you have nothing to do, describe what you see in English. It's not a job. It's part of your life.",
    zh: "早上写十分钟，再做十分钟四词练习或句式变化。上班路上听一段一分钟音频，写下听到的每个词。晚上读二十分钟，在语境里学新词。无事可做时，用英语描述眼前所见。这不是工作，是生活的一部分。",
    model: "",
    facts: [
      "Write for ten minutes in the morning.",
      "Do the four-word exercise or sentence variations for another ten minutes.",
      "On the commute, listen to a one-minute clip and write down every word.",
      "At night, read for twenty minutes and learn words in context.",
      "When there is nothing to do, describe what you see in English.",
      "English is part of life, not a job.",
    ],
    swaps: ["write for ten minutes → spend ten minutes writing", "on the way to work → during your commute", "nothing to do → a spare moment"],
  },
];

export const DICTATION_CLIPS = [
  {
    id: "education",
    title: "THE EDUCATION PROBLEM",
    zh: "教育体系的问题",
    source: "LISTENING CLIP",
    level: "HARD",
    note: "书面语材料。句子长、抽象名词多，真正的难点是冠词、介词和被动语态。",
    sentences: [
      "The dire American education system has spawned a wide range of proposals and half-baked solutions.",
      "The core of the problem, according to most, is a test-oriented system which has become increasingly narrow and stringent in recent years.",
      "The difficulty is finding an applicable alternative.",
      "Any viable model of teaching and evaluating students would have to be both inclusive and comprehensive, while at the same time recognizing individual achievement.",
      "Whatever the case, most officials and leaders have concluded that the current problem doesn't lie in the hands of the teachers, but rather in the standards handed down by the Education Board.",
    ],
  },
  {
    id: "practice",
    title: "PRACTICE, NOT MAGIC",
    zh: "练习，不是魔法",
    source: "DAILY REMINDER",
    level: "EASY",
    note: "句子短、语速可调。注意 practice / fluency 的重音，以及 not just 的连读。",
    sentences: [
      "Practice is the thing that gets you to fluency, not just learning.",
      "Time does not equal success.",
      "The only way is to learn to think in English.",
    ],
  },
  {
    id: "thinking",
    title: "THE ONLY WAY",
    zh: "唯一的路",
    source: "DAILY REMINDER",
    level: "MEDIUM",
    note: "注意 absolutely、fluent、thinking 的节奏。听写时先写实词，再补冠词和介词。",
    sentences: [
      "If you want to become a totally fluent English speaker, you absolutely have to start thinking in English.",
      "There's no other way to do it.",
      "You cannot be a fluent English speaker if you're not thinking in English as you speak English.",
    ],
  },
  {
    id: "listening",
    title: "THEY'RE NOT SPEAKING FOR YOU",
    zh: "他们不是为你说英语",
    source: "DAILY REMINDER",
    level: "MEDIUM",
    note: "they're / their / there 容易混；not speaking for you to understand 的节奏要听出来。",
    sentences: [
      "They're not speaking for you to understand.",
      "If it's too easy for you, then you're doing it wrong.",
      "It's very simple, very boring, very useful.",
    ],
  },
  {
    id: "lifestyle",
    title: "MAKE IT YOUR LIFESTYLE",
    zh: "让它成为生活方式",
    source: "DAILY REMINDER",
    level: "EASY",
    note: "连读多：it's not a job / part of your life。先听三遍，再动笔。",
    sentences: [
      "It's not a job. It's part of your life. So make it your lifestyle.",
      "Don't just read and skip the new words.",
      "I get up in the morning. I brush my teeth. I just do it.",
    ],
  },
  {
    id: "impossible",
    title: "IMPOSSIBLE WITHOUT ENGLISH",
    zh: "不用英语思考就做不到",
    source: "DAILY REMINDER",
    level: "HARD",
    note: "三个长句，注意 if 条件句和完成时。别急着查原文，先听写、再推测、最后核对。",
    sentences: [
      "This one is impossible to do without thinking in English.",
      "You can't do these if you're thinking in another language.",
      "If it isn't difficult, then you're not doing it right.",
    ],
  },
];

export const DESC_SCENES = [
  {
    id: "window", title: "窗外", en: "OUT THE WINDOW", color: "cyan", icon: "window",
    look: ["What can you see first, in the foreground?", "What is happening in the background?", "What colors and shapes stand out?", "What small movement catches your eye?"],
    feel: ["How does this view make you feel?", "Which part would you change if you could?"],
    guess: ["Who might be out there, and where are they going?", "What happened here five minutes ago?", "What will happen next?"],
    prompt: "描述你此刻窗外的一个画面。先写 5 句“有什么”，再加 2 句“我怎么看”，最后加 3 个推测。",
  },
  {
    id: "subway", title: "地铁", en: "ON THE SUBWAY", color: "purple", icon: "train",
    look: ["Who is sitting opposite you?", "What are three details of their appearance?", "What sounds can you hear?", "What is the person next to the door doing?"],
    feel: ["Is the atmosphere tense, sleepy, or friendly?", "Which detail makes you feel that way?"],
    guess: ["Where is the person in the red jacket going?", "What are they thinking about?", "Why did they choose that seat?"],
    prompt: "你在车厢里，对面坐着一个陌生人。用 5 句描述他，用 3 句猜他的身份、心情和下一步。",
  },
  {
    id: "cafe", title: "咖啡馆", en: "AT THE CAFE", color: "orange", icon: "cup",
    look: ["What is on the table in front of you?", "What does the cup look like?", "Who is working behind the counter?", "What is the person by the window doing?"],
    feel: ["Does this place feel warm, noisy, or lonely?", "What smell or sound creates that feeling?"],
    guess: ["What is the barista thinking?", "What is the person by the window writing?", "What will happen when the rain stops?"],
    prompt: "选一个店员或顾客，先用 5 句写外观与动作，再用 3 句推测他的故事。",
  },
  {
    id: "park", title: "公园", en: "IN THE PARK", color: "green", icon: "tree",
    look: ["What is the weather like?", "Who is using the space?", "What is growing or moving?", "What is in the far background?"],
    feel: ["Does this scene feel peaceful or busy?", "Which detail creates that mood?"],
    guess: ["Why is that person alone?", "What are the two friends talking about?", "What will this place look like in an hour?"],
    prompt: "用“加细节—加感受—做推测”三层，描述公园里的一个具体的人。",
  },
  {
    id: "desk", title: "深夜书桌", en: "LATE-NIGHT DESK", color: "yellow", icon: "desk",
    look: ["What objects are on the desk?", "What does the light fall on?", "What is half-finished?", "What is the room's temperature like?"],
    feel: ["Does the scene feel productive, tired, or calm?", "Which object tells you that?"],
    guess: ["What was the person doing an hour ago?", "What will they do when they finish?", "Why did they stay up?"],
    prompt: "描述你的书桌，但不要只列物品。让每件东西透露一点正在发生的事。",
  },
  {
    id: "store", title: "超市货架", en: "AT THE STORE", color: "pink", icon: "cart",
    look: ["What is on the shelf in front of you?", "Who is reaching for something?", "What colors repeat?", "What is happening at the checkout?"],
    feel: ["Does this place feel ordinary, chaotic, or cheerful?", "What detail gives it away?"],
    guess: ["What is the person buying, and for whom?", "What will they cook tonight?", "What are they avoiding?"],
    prompt: "在货架前观察一个人，用 6 句写他买了什么、怎么选，再猜他今晚的生活。",
  },
];

export const WRITING_PROMPTS = [
  {
    id: "week", title: "本周计划", en: "THE WEEK AHEAD", color: "yellow",
    desc: "周一或周日写：接下来一周要做什么。不是许愿，是排期。",
    starter: "This week, I want to ... / By Friday, I will have ... / The one thing I won't skip is ...",
    focus: ["用将来时与时间状语", "至少一个 if 条件句", "把模糊的 busy 换成具体安排"],
    minutes: 10,
  },
  {
    id: "yesterday", title: "昨日异事", en: "SOMETHING ODD YESTERDAY", color: "pink",
    desc: "昨天一定有一件不太寻常的小事。写下来，带细节，不要写成流水账。",
    starter: "Yesterday, I noticed ... / At first I thought ..., but then ... / What struck me was ...",
    focus: ["一个具体场景", "两个感官细节", "一个推测，不急着下结论"],
    minutes: 10,
  },
  {
    id: "review", title: "影评 / 书评", en: "A FILM OR BOOK", color: "cyan",
    desc: "最近看的电影、书或剧：发生了什么，人物是谁，你为什么喜欢或不喜欢。",
    starter: "The story follows ... / What I liked most was ... / It made me think about ...",
    focus: ["不用 good / bad 概括", "至少一个精确形容词", "一句推荐或不推荐的理由"],
    minutes: 12,
  },
  {
    id: "diary", title: "今日日记", en: "TODAY'S DIARY", color: "green",
    desc: "睡前写 5–8 句，只写今天一件事。时间到就停，不追求漂亮。",
    starter: "Today, the strangest thing was ... / I kept thinking about ... / Tomorrow, I'd like to ...",
    focus: ["连续写，不回头改", "句长有变化", "至少用掉一个新词"],
    minutes: 10,
  },
];

export const WORDS_OF_DAY = [
  { word: "serendipity", zh: "意外发现美好事物的运气", note: "If you find good things without looking for them, serendipity brought them to you." },
  { word: "deliberate", zh: "深思熟虑的；故意的", note: "A deliberate practice is slow, focused and repeated." },
  { word: "articulate", zh: "表达清楚有力的", note: "Replace 'a good speaker' with 'an articulate speaker'." },
  { word: "immerse", zh: "使沉浸", note: "Immerse yourself in English, not just study it." },
  { word: "context", zh: "语境；上下文", note: "A word without context is only a label." },
  { word: "retain", zh: "记住；保留", note: "The struggle is what makes a word stick." },
  { word: "spontaneous", zh: "自发的；即兴的", note: "Fluency shows up in spontaneous speech." },
];

export const CHECKLIST_WRITING = [
  "标点：逗号前有没有多余空格？逗号、句号、冒号、分号是否用对？",
  "拼写：有没有一眼看出的拼写错误？",
  "句法：是不是每句都一样长、一样开头？至少改一处结构。",
  "形容词：有没有 good / nice / bad / better 这类大词？换成更精确的。",
  "新词：至少用了一个最近学的词，且搭配正确。",
  "画面：读者能不能在脑中看到这个场景？",
];
