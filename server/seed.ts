import { storage, db } from "./storage";
import { users, categories, stories, books, motivationalStories, storyParts, footerPages, duas } from "@shared/schema";
import { count, eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function seedDatabase() {
  const [userCount] = await db.select({ count: count() }).from(users);

  if (userCount.count === 0) {
    const hashedPassword = await hashPassword("AnTofl0m@0u3R");
    await storage.createUserWithEmail({
      username: "admin",
      email: "muktadirhoshin@gmail.com",
      password: hashedPassword,
      name: "Admin",
      role: "owner",
    });

    const cat1 = await storage.createCategory({
      name: "Stories of the Sahaba",
      slug: "sahaba",
      description: "The lives and sacrifices of the Prophet's noble companions (Sahaba) who shaped Islamic history.",
      image: "/images/category-sahaba.png",
      orderIndex: 0,
    });

    const cat2 = await storage.createCategory({
      name: "Lives of the Awliya",
      slug: "awliya",
      description: "Biographies of the righteous saints (Awliya) who devoted their lives to spiritual excellence.",
      image: "/images/category-awliya.png",
      orderIndex: 1,
    });

    const cat3 = await storage.createCategory({
      name: "Miracles & Karamat",
      slug: "karamat",
      description: "Extraordinary events and miracles (Karamat) witnessed throughout Islamic history.",
      image: "/images/category-karamat.png",
      orderIndex: 2,
    });

    const cat4 = await storage.createCategory({
      name: "Inspirational Islamic History",
      slug: "history",
      description: "Key events and turning points that defined the course of Islamic civilization.",
      image: "/images/category-history.png",
      orderIndex: 3,
    });

    await storage.createCategory({
      name: "Prophets' Companions",
      slug: "prophets-companions",
      description: "Deeper insights into the companions who walked alongside the prophets of God.",
      image: "/images/category-prophets.png",
      orderIndex: 4,
    });

    const storyContent1 = `<p>Abu Bakr al-Siddiq, known as "The Truthful," was the closest companion of Prophet Muhammad (peace be upon him) and the first adult male to embrace Islam. His story is one of unwavering faith, incredible sacrifice, and gentle leadership that continues to inspire millions around the world.</p>
<h2>Early Life and Acceptance of Islam</h2>
<p>Abu Bakr was a successful merchant in Mecca, known for his honesty and gentle nature. When the Prophet Muhammad (PBUH) shared the message of Islam with him, Abu Bakr accepted without hesitation. This immediate belief earned him the title "al-Siddiq" (The Truthful), as he never doubted the Prophet's words for even a moment.</p>
<h2>The Great Sacrifice</h2>
<p>Abu Bakr's devotion went far beyond words. He spent a large portion of his wealth to free enslaved Muslims who were being persecuted for their faith. Among those he freed was Bilal ibn Rabah, who would become the first muezzin (caller to prayer) in Islam. Abu Bakr's generosity knew no bounds, and he gave everything he had for the sake of his faith.</p>
<h2>The Migration to Medina</h2>
<p>When the Prophet Muhammad (PBUH) was commanded to migrate from Mecca to Medina, Abu Bakr was chosen as his companion on this dangerous journey. During their time hiding in the Cave of Thawr, with enemies searching for them, Abu Bakr was overcome with fear for the Prophet's safety. The Prophet reassured him with the words: "Do not grieve, indeed God is with us." This moment, recorded in the Quran (9:40), remains one of the most touching examples of companionship in Islamic history.</p>
<h2>Legacy of Leadership</h2>
<p>After the Prophet's passing, Abu Bakr became the first Caliph of Islam. Despite his grief, he led the Muslim community with wisdom and compassion. His leadership during a critical period helped preserve the unity of the early Muslim community and ensured the continuation of the Prophet's mission.</p>`;

    const storyContent2 = `<p>Khadijah bint Khuwaylid was the first wife of Prophet Muhammad (PBUH) and the first person to accept Islam. Her story is a powerful testament to the strength, wisdom, and devotion of a woman who stood by the truth when the whole world stood against it.</p>
<h2>A Remarkable Woman</h2>
<p>Before Islam, Khadijah was one of the most successful merchants in Mecca. She was known as "al-Tahira" (The Pure One) for her impeccable character. Her intelligence, independence, and business acumen made her one of the most respected figures in Meccan society.</p>
<h2>Standing by the Truth</h2>
<p>When the Prophet Muhammad (PBUH) received his first revelation on Mount Hira and came home trembling, it was Khadijah who comforted him with words that echo through history: "Never! By God, God will never disgrace you. You maintain ties of kinship, you bear the burden of the weak, you help the poor, you entertain guests, and you endure hardships in the path of truth."</p>
<h2>Years of Sacrifice</h2>
<p>Khadijah endured years of persecution alongside her husband. When the Muslims were boycotted and confined to the valley of Abu Talib, she shared in every hardship. Her wealth, her comfort, and her health were all sacrificed for the sake of her faith. She passed away during this difficult period, and her death marked what the Prophet called "the Year of Sorrow."</p>`;

    const storyContent3 = `<p>Rumi, known in the Muslim world as Mawlana Jalaluddin Rumi, was a 13th-century poet, scholar, and Sufi mystic whose teachings on love, tolerance, and spiritual seeking have resonated across cultures and centuries. His works remain among the most widely read poetry in the world.</p>
<h2>From Scholar to Mystic</h2>
<p>Born in 1207 in Balkh (present-day Afghanistan), Rumi was raised in a family of learned theologians. He followed his father's path as a religious scholar and preacher. His life took a transformative turn when he met the wandering mystic Shams of Tabriz, an encounter that awakened in him a deep spiritual passion that would change the course of literary and spiritual history.</p>
<h2>The Teaching of Love</h2>
<p>Rumi's central teaching revolves around love as the fundamental force of the universe. He taught that love for God is not separate from love for humanity, and that the path to the Divine runs through the human heart. His poetry expresses this with breathtaking beauty and depth.</p>
<h2>Legacy</h2>
<p>Rumi's masterwork, the Masnavi, spans six volumes and is often called "the Quran in Persian" for its spiritual depth. His teachings inspired the Mevlevi Order, known in the West as the "Whirling Dervishes," whose meditative spinning dance is a form of active prayer. Today, Rumi is one of the best-selling poets in the English-speaking world, a testament to the universal nature of his message.</p>`;

    const storyContent4 = `<p>Throughout Islamic history, there have been remarkable accounts of extraordinary events that defied the natural order. Known as Karamat (miracles granted to the righteous friends of God), these events serve as signs of divine favor and are carefully documented in classical Islamic literature.</p>
<h2>The Spring of Zamzam</h2>
<p>One of the most enduring miracles in Islamic tradition is the spring of Zamzam in Mecca. According to tradition, when Hagar (Hajar) was left in the desert with her infant son Ishmael (Ismail), she ran desperately between the hills of Safa and Marwa searching for water. In response to her prayers, a spring burst forth from the ground beneath baby Ishmael's feet. This spring has flowed continuously for thousands of years and continues to provide water to millions of pilgrims to this day.</p>
<h2>The Night Journey</h2>
<p>Perhaps the most well-known miraculous event in Islam is the Isra and Mi'raj, the Night Journey and Ascension of Prophet Muhammad (PBUH). In a single night, the Prophet was transported from Mecca to Jerusalem (al-Aqsa Mosque) and then ascended through the heavens, where he met previous prophets and received the commandment of five daily prayers. This event, referenced in the Quran (17:1), represents the pinnacle of spiritual elevation.</p>`;

    const storyContent5 = `<p>The Treaty of Hudaybiyyah, signed in 628 CE between the Muslims of Medina and the Quraysh of Mecca, is one of the most pivotal events in Islamic history. Though it initially appeared to be a setback, it ultimately proved to be a turning point that led to the peaceful opening of Mecca and the rapid spread of Islam throughout Arabia.</p>
<h2>The Journey to Mecca</h2>
<p>In the sixth year after the migration to Medina, Prophet Muhammad (PBUH) set out with approximately 1,400 companions to perform Umrah (the lesser pilgrimage) at the Kaaba in Mecca. They carried no weapons of war, only the sacrificial animals, demonstrating their peaceful intentions.</p>
<h2>The Negotiations</h2>
<p>The Quraysh, unwilling to allow the Muslims to enter Mecca, sent negotiators to block them at Hudaybiyyah, on the outskirts of the city. After tense negotiations, a treaty was agreed upon. Many of the terms appeared unfavorable to the Muslims, and some companions were deeply troubled by the agreement.</p>
<h2>Divine Wisdom Revealed</h2>
<p>The Quran described this treaty as a "clear victory" (48:1), a description that puzzled many at the time. However, the wisdom of this peace became apparent within two years. The cessation of hostilities allowed Islam to spread through personal interactions and dialogue rather than conflict. When the Quraysh violated the treaty terms, the Muslims entered Mecca peacefully with 10,000 supporters, achieving without bloodshed what years of conflict could not.</p>`;

    await storage.createStory({
      title: "Abu Bakr al-Siddiq: The Truthful Companion",
      slug: "abu-bakr-the-truthful-companion",
      excerpt: "Discover the story of Abu Bakr, the first adult male to accept Islam and the closest companion of the Prophet. His unwavering faith and sacrifice continue to inspire millions.",
      content: storyContent1,
      categoryId: cat1.id,
      thumbnail: "/images/category-sahaba.png",
      youtubeUrl: "",
      tags: ["sahaba", "abu-bakr", "companions", "faith"],
      status: "published",
      featured: true,
      publishedAt: new Date("2026-02-15"),
    });

    await storage.createStory({
      title: "Khadijah: The First Believer",
      slug: "khadijah-the-first-believer",
      excerpt: "The remarkable story of Khadijah bint Khuwaylid, the Prophet's first wife and the first person to accept Islam. A woman of strength, wisdom, and unwavering devotion.",
      content: storyContent2,
      categoryId: cat1.id,
      thumbnail: "/images/category-prophets.png",
      youtubeUrl: "",
      tags: ["sahaba", "khadijah", "women-in-islam", "first-believer"],
      status: "published",
      featured: true,
      publishedAt: new Date("2026-02-20"),
    });

    await storage.createStory({
      title: "Rumi: The Poet of Divine Love",
      slug: "rumi-the-poet-of-divine-love",
      excerpt: "Journey into the life and teachings of Jalaluddin Rumi, the 13th-century Sufi mystic whose poetry on love and spiritual seeking continues to captivate hearts worldwide.",
      content: storyContent3,
      categoryId: cat2.id,
      thumbnail: "/images/category-awliya.png",
      youtubeUrl: "",
      tags: ["awliya", "rumi", "sufi", "poetry", "mysticism"],
      status: "published",
      featured: true,
      publishedAt: new Date("2026-02-25"),
    });

    await storage.createStory({
      title: "Miracles That Shaped History",
      slug: "miracles-that-shaped-history",
      excerpt: "Explore remarkable miracles documented throughout Islamic history, from the eternal spring of Zamzam to the Night Journey of the Prophet.",
      content: storyContent4,
      categoryId: cat3.id,
      thumbnail: "/images/category-karamat.png",
      youtubeUrl: "",
      tags: ["karamat", "miracles", "zamzam", "night-journey"],
      status: "published",
      featured: false,
      publishedAt: new Date("2026-02-28"),
    });

    await storage.createStory({
      title: "The Treaty of Hudaybiyyah: Victory Through Peace",
      slug: "treaty-of-hudaybiyyah",
      excerpt: "How a seemingly unfavorable peace treaty became one of Islam's greatest triumphs, opening the door to the peaceful transformation of an entire civilization.",
      content: storyContent5,
      categoryId: cat4.id,
      thumbnail: "/images/category-history.png",
      youtubeUrl: "",
      tags: ["history", "treaty", "peace", "mecca"],
      status: "published",
      featured: false,
      publishedAt: new Date("2026-03-01"),
    });

    console.log("Database seeded successfully");
  } else {
    const adminUser = await storage.getUserByUsername("admin");
    if (adminUser && adminUser.role !== "owner" && adminUser.role !== "admin") {
      await storage.updateUser(adminUser.id, { role: "owner" } as any);
    }
    if (adminUser && !adminUser.email) {
      await storage.updateUser(adminUser.id, { email: "muktadirhoshin@gmail.com", name: "Admin" } as any);
    }
  }

  const [bookCount] = await db.select({ count: count() }).from(books);
  if (bookCount.count === 0) {
    await storage.createBook({
      title: "The Sealed Nectar",
        slug: "the-sealed-nectar",
        author: "Safiur Rahman Mubarakpuri",
        description: "An award-winning biography of Prophet Muhammad (PBUH) that provides a comprehensive account of his life and mission. This classic work covers the Prophet's life from birth to death.",
        coverUrl: "https://m.media-amazon.com/images/I/71fVwKLOY9L._AC_UF1000,1000_QL80_.jpg",
        category: "Seerah",
        type: "free",
        fullContentUrl: null,
      } as any);

      await storage.createBook({
        title: "Fortress of the Muslim",
        slug: "fortress-of-the-muslim",
        author: "Sa'id bin Ali bin Wahf Al-Qahtani",
        description: "A collection of supplications (du'as) from the Quran and Sunnah, organized by topic for daily use. Essential companion for every Muslim.",
        coverUrl: "https://m.media-amazon.com/images/I/51fhcEHq4oL._SY445_SX342_.jpg",
        category: "Dawah",
        type: "free",
        fullContentUrl: null,
      } as any);

      await storage.createBook({
        title: "Stories of the Prophets",
        slug: "stories-of-the-prophets",
        author: "Ibn Kathir",
        description: "A comprehensive collection of stories of the Prophets from Adam to Muhammad (peace be upon them all), drawn from the Quran and authentic hadith traditions.",
        coverUrl: "https://m.media-amazon.com/images/I/71dC4PSHxlL._AC_UF1000,1000_QL80_.jpg",
        category: "Seerah",
        type: "free",
        fullContentUrl: null,
      } as any);

      await storage.createBook({
        title: "Purification of the Heart",
        slug: "purification-of-the-heart",
        author: "Hamza Yusuf",
        description: "An exploration of the diseases of the heart and their cures, based on the classical poem by Imam al-Mawlud. A profound guide to spiritual development.",
        coverUrl: "https://m.media-amazon.com/images/I/41zzDlIhm-L._SY445_SX342_.jpg",
        category: "Tazkiyah",
        type: "paid",
        price: "$16.99",
        amazonAffiliateLink: "https://www.amazon.com/dp/1929694156",
        affiliateLink: "https://www.amazon.com/dp/1929694156",
      } as any);

      await storage.createBook({
        title: "In the Footsteps of the Prophet",
        slug: "in-the-footsteps-of-the-prophet",
        author: "Tariq Ramadan",
        description: "A fresh look at the life of Muhammad (PBUH) that highlights the spiritual and ethical teachings that can be drawn from the events of his life.",
        coverUrl: "https://m.media-amazon.com/images/I/51ckiEXeURL._SY445_SX342_.jpg",
        category: "Seerah",
        type: "paid",
        price: "$13.99",
        amazonAffiliateLink: "https://www.amazon.com/dp/0195374762",
        affiliateLink: "https://www.amazon.com/dp/0195374762",
      } as any);

      await storage.createBook({
        title: "The Book of Assistance",
        slug: "the-book-of-assistance",
        author: "Imam al-Haddad",
        description: "A classic manual of spiritual development, covering the essentials of faith, worship, and good character. Translated with commentary for modern readers.",
        coverUrl: "https://m.media-amazon.com/images/I/31q4s2S-HxL._SY445_SX342_.jpg",
        category: "Tazkiyah",
        type: "free",
        fullContentUrl: null,
      } as any);

    console.log("Books seeded successfully");
  }

  const [motivationalCount] = await db.select({ count: count() }).from(motivationalStories);
  if (motivationalCount.count === 0) {
    const story1 = await storage.createMotivationalStory({
      title: "The Merchant Who Chose Honesty",
      slug: "the-merchant-who-chose-honesty",
      description: "A powerful story about a Muslim merchant who faced a critical choice between profit and integrity, and how his honesty transformed his business and community.",
      content: "In the bustling markets of medieval Baghdad, a young merchant named Yusuf faced the greatest test of his faith. Known for his fine silk trade, he discovered a flaw in a shipment worth thousands of dinars. Rather than hide the defect, he chose a path that would define his legacy.",
      category: "Business & Ethics",
      published: true,
    });
    await storage.createMotivationalLesson({ storyId: story1.id, title: "The Discovery", orderIndex: 0, content: "<h2>The Discovery</h2><p>Yusuf ibn Ibrahim had built his reputation over fifteen years of honest trade in the great bazaar of Baghdad. His silk stall was known not just for the quality of its wares, but for the integrity of its owner. Customers traveled from distant provinces to buy from him, knowing that every thread was as described, every price was fair.</p><p>One morning, as the call to Fajr prayer echoed across the city, Yusuf arrived at his warehouse to inspect a new shipment from China — the finest silk he had ever seen. The colors were magnificent: deep crimson, royal blue, and shimmering gold. This shipment alone could bring him enough profit to expand his business tenfold.</p><p>But as he ran his experienced fingers along the bolts of fabric, his heart sank. Hidden beneath the surface beauty, he found a weakness in the weave. The silk would hold for perhaps six months before beginning to fray. To an untrained eye, it was invisible. He could sell every bolt at full price, and no customer would know — at least not immediately.</p>" });
    await storage.createMotivationalLesson({ storyId: story1.id, title: "The Temptation", orderIndex: 1, content: "<h2>The Temptation</h2><p>Yusuf's business partner, Tariq, examined the silk and shrugged. 'No one will notice,' he said. 'By the time the fabric weakens, the sale will be long forgotten. We stand to make fifty thousand dinars.' The number hung in the air like perfume — intoxicating and hard to resist.</p><p>That night, Yusuf could not sleep. He thought of the hadith of the Prophet Muhammad ﷺ: <em>'The honest and trustworthy merchant will be with the Prophets, the truthful, and the martyrs on the Day of Judgment.'</em> (Tirmidhi). He thought of his father, who had taught him that a Muslim's word is his bond, and that wealth gained through deception carries no barakah (blessing).</p><p>He also thought of his growing family — his wife expecting their fourth child, the rising costs of living in Baghdad. Fifty thousand dinars would secure their future for years. The temptation was real, and he felt its weight pressing down on him like a physical force.</p>" });
    await storage.createMotivationalLesson({ storyId: story1.id, title: "The Decision and Its Fruit", orderIndex: 2, content: "<h2>The Decision and Its Fruit</h2><p>The next morning, Yusuf made his decision. He called a gathering of his regular customers and showed them the flaw in the silk. He offered the fabric at a steep discount, clearly labeling its weakness. 'I would rather lose profit,' he told them, 'than lose your trust and the pleasure of Allah.'</p><p>His partner Tariq was furious, calling him a fool. But something remarkable happened in the weeks that followed. Word spread throughout Baghdad about the honest merchant who had sacrificed a fortune rather than deceive his customers. New buyers came from across the Abbasid empire, specifically seeking out the man whose integrity was beyond question.</p><p>Within a year, Yusuf's business had grown far beyond what the flawed silk would have earned him. More importantly, he had earned something that no amount of money could buy: the trust of an entire community and peace in his heart before Allah.</p><p>As the Quran teaches: <em>'And whoever fears Allah — He will make for him a way out, and will provide for him from where he does not expect.'</em> (Quran 65:2-3)</p>" });

    const story2 = await storage.createMotivationalStory({
      title: "A Convert's Journey to Light",
      slug: "a-converts-journey-to-light",
      description: "The inspiring true-to-life story of a Western professional who found Islam through an unexpected encounter, and how faith transformed every aspect of their life.",
      content: "Sarah, a successful corporate lawyer in London, never expected that a chance meeting during a business trip would lead her on a spiritual journey that would redefine everything she believed about purpose, meaning, and God.",
      category: "Dawah & Conversion",
      published: true,
    });
    await storage.createMotivationalLesson({ storyId: story2.id, title: "The Unexpected Encounter", orderIndex: 0, content: "<h2>The Unexpected Encounter</h2><p>Sarah Mitchell had everything the world told her she should want: a corner office at a prestigious London law firm, a luxury flat in Kensington, and a social calendar that would make most people envious. Yet every Sunday morning, she sat alone in her pristine apartment feeling an emptiness she couldn't name.</p><p>During a business trip to Istanbul, a delayed flight forced her to spend an unexpected night in the city. Her Turkish colleague, Fatima, invited her to dinner at her family's home in the old quarter. It was there, surrounded by the warmth of a family gathered around a simple meal, beginning with 'Bismillah' and ending with gratitude, that Sarah felt something stir inside her.</p><p>'Why does your family seem so... peaceful?' Sarah asked Fatima later that evening, as the call to Isha prayer drifted through the open windows. Fatima smiled gently and said, 'Because we know why we're here.'</p>" });
    await storage.createMotivationalLesson({ storyId: story2.id, title: "The Search for Truth", orderIndex: 1, content: "<h2>The Search for Truth</h2><p>Back in London, Sarah couldn't shake the feeling that had awakened in Istanbul. She began reading — first academic texts about Islam, then translations of the Quran itself. The words of Surah Ar-Rahman struck her deeply: <em>'Which of the favors of your Lord will you deny?'</em> repeated over and over, as if speaking directly to her ungrateful heart.</p><p>She started visiting a local mosque, sitting quietly in the women's section during Friday prayers. The imam's words about finding contentment through submission to God's will resonated with something deep within her. She met other converts who shared their stories — each unique, yet each echoing the same theme of finding completeness in faith.</p><p>For six months, she studied, questioned, and reflected. She debated with herself during long walks along the Thames. She worried about what her colleagues would think, what her parents would say. But the pull toward truth grew stronger with each passing day.</p>" });
    await storage.createMotivationalLesson({ storyId: story2.id, title: "The Declaration and New Life", orderIndex: 2, content: "<h2>The Declaration and New Life</h2><p>On a quiet Friday morning in Ramadan, Sarah took her shahada at the East London Mosque. 'Ash-hadu an la ilaha ill-Allah, wa ash-hadu anna Muhammadan rasul-Allah.' The words felt like coming home to a place she had always been searching for but never knew existed.</p><p>The transition wasn't without challenges. Some friendships faded, and family gatherings became complicated. But new bonds formed — deep, authentic connections with people who shared her values. She found a Muslim women's professional network and discovered that her legal skills could serve her community in powerful ways.</p><p>Two years later, Sarah — now also known as Salma — established a pro-bono legal clinic serving Muslim communities in London. She had traded the emptiness of material success for the richness of purposeful living. As she often reflected: 'I didn't lose my old life. I gained my real one.'</p><p>The Prophet ﷺ said: <em>'Whoever comes to Allah walking, Allah comes to him running.'</em> (Hadith Qudsi, Bukhari). Sarah's story is living proof of this divine promise.</p>" });

    const story3 = await storage.createMotivationalStory({
      title: "The Night Prayer That Changed Everything",
      slug: "the-night-prayer-that-changed-everything",
      description: "How a struggling young Muslim rediscovered the power of Tahajjud and found clarity, peace, and direction during the darkest period of his life.",
      content: "Ahmad was at rock bottom — failed exams, a broken family, and a faith that felt hollow. Then one sleepless night, instead of scrolling through his phone, he decided to pray. That single decision set in motion a transformation he never imagined possible.",
      category: "Spiritual Motivation",
      published: true,
    });
    await storage.createMotivationalLesson({ storyId: story3.id, title: "The Darkest Hour", orderIndex: 0, content: "<h2>The Darkest Hour</h2><p>At twenty-two, Ahmad felt like life had conspired against him. He had failed his university exams for the second time. His parents' marriage was crumbling. The friends he thought would always be there had drifted away to their own problems. He went through the motions of daily prayers, but his heart was absent — his lips moved, but his soul remained untouched.</p><p>One night at 3 AM, lying awake in the suffocating darkness of his small room, Ahmad reached for his phone as usual — ready to lose himself in the endless scroll of social media. But something made him pause. A verse he had memorized as a child echoed in his mind: <em>'Is not Allah enough for His servant?'</em> (Quran 39:36)</p><p>He put the phone down, made wudu with cold water that jolted him awake, and spread his prayer mat facing the qiblah. He stood in the silence of the pre-dawn darkness and raised his hands: 'Allahu Akbar.' For the first time in months, he meant it.</p>" });
    await storage.createMotivationalLesson({ storyId: story3.id, title: "The Transformation", orderIndex: 1, content: "<h2>The Transformation</h2><p>That first Tahajjud prayer was awkward and short. Ahmad barely remembered the longer surahs, and his focus kept drifting. But something shifted inside him — a tiny crack of light in the darkness. He decided to try again the next night, and the next.</p><p>Within a week, he noticed something unexpected: a clarity of mind he hadn't experienced in years. The anxiety that had been his constant companion began to loosen its grip. He started studying with renewed focus, not because his problems had disappeared, but because prayer had given him the strength to face them.</p><p>He began reading the translation of the Quran during the quiet hours after Tahajjud. The verses seemed to speak directly to his situation: <em>'Verily, with hardship comes ease.'</em> (Quran 94:6). He started a journal, recording his reflections and prayers. He joined a study circle at his local mosque, where he found brothers who understood his struggles.</p><p>Six months later, Ahmad passed his exams with honors. His parents' situation remained difficult, but he had found the inner resilience to support them rather than crumble alongside them. He had discovered what countless Muslims before him had known: that the last third of the night is when Allah descends to the lowest heaven, asking, 'Is there anyone who calls upon Me that I may answer him?' (Bukhari)</p><p>The prayer mat in his room, once gathering dust, now bore the marks of regular use — a testament to the power of turning to Allah in the depths of the night.</p>" });

    const story4 = await storage.createMotivationalStory({
      title: "Living Halal in a Modern World",
      slug: "living-halal-in-a-modern-world",
      description: "Practical wisdom and inspiring examples of Muslims who navigate modern life while staying true to Islamic principles — from halal finance to ethical consumption.",
      content: "In a world designed around conventional finance, processed food, and relentless consumerism, how do Muslims maintain halal practices without retreating from society? These stories show it's not only possible — it's a path to greater success and fulfillment.",
      category: "Daily Life Guidance",
      published: true,
    });
    await storage.createMotivationalLesson({ storyId: story4.id, title: "Halal Finance: The Couple Who Said No to Riba", orderIndex: 0, content: "<h2>Halal Finance: The Couple Who Said No to Riba</h2><p>When Omar and Aisha decided to buy their first home in Manchester, everyone told them it was impossible without a conventional mortgage. Interest-based loans were simply 'how things work,' their well-meaning relatives explained. But Omar had studied the Quran's stern warnings about riba (usury): <em>'Allah has permitted trade and forbidden riba.'</em> (Quran 2:275)</p><p>Instead of compromising, they researched Islamic finance options. They found a halal home purchase plan through an Islamic bank, which used a diminishing musharakah (shared ownership) model. The monthly payments were slightly higher, but they slept peacefully knowing every pound was earned and spent in accordance with Allah's guidance.</p><p>They also restructured their savings, moving from conventional interest-bearing accounts to Sharia-compliant investment funds. Five years later, their halal portfolio had outperformed many conventional alternatives — a reminder that Allah's path, though sometimes harder, often leads to unexpected barakah.</p>" });
    await storage.createMotivationalLesson({ storyId: story4.id, title: "Ethical Work: Standing Firm in the Corporate World", orderIndex: 1, content: "<h2>Ethical Work: Standing Firm in the Corporate World</h2><p>Khadijah was a rising marketing executive at a major London agency. When her team was assigned a campaign for an alcohol brand — one of the agency's biggest clients — she faced a moment of truth. Refusing could stall her career; accepting would compromise her faith.</p><p>She approached her manager with honesty: 'I'm grateful for this opportunity, but working on alcohol campaigns conflicts with my religious values. I'd love to contribute to another account where I can give my absolute best.' Her heart pounded as she waited for the response.</p><p>To her surprise, her manager respected her stance. She was reassigned to a healthcare client, where her passion and dedication led to an award-winning campaign. The experience taught her — and her colleagues — that integrity and professional excellence aren't just compatible; they're inseparable.</p><p>The Prophet ﷺ reminded us: <em>'Whoever leaves something for the sake of Allah, Allah will replace it with something better.'</em> (Ahmad). Khadijah's story is a modern proof of this timeless promise.</p>" });
    await storage.createMotivationalLesson({ storyId: story4.id, title: "Raising Muslim Children in a Secular Society", orderIndex: 2, content: "<h2>Raising Muslim Children in a Secular Society</h2><p>Ibrahim and Maryam raised four children in suburban America, navigating the daily challenges of maintaining Islamic identity in a secular environment. Their approach was neither isolationist nor assimilationist — it was intentional engagement rooted in Islamic values.</p><p>They established family traditions that made Islam attractive rather than restrictive: Jumu'ah (Friday) family dinners became the highlight of the week. Each child led a short Islamic reminder based on what they had learned. Ramadan was transformed into a month of adventure — with special decorations, charitable projects, and community iftars.</p><p>They taught their children to be confidently Muslim: to explain their dietary choices with pride, to share the beauty of their prayers with curious classmates, and to see their faith as a gift rather than a burden. When their eldest daughter was asked why she wore hijab, she responded with a confidence that made her parents' hearts swell: 'Because I choose to be known for my mind and character, not my appearance.'</p><p>Two decades later, all four children remain practicing Muslims, each contributing to their communities in meaningful ways — a doctor, a teacher, an engineer, and a social worker. The secret, Ibrahim often says, was never about building walls against the world, but about building roots so deep that no storm could uproot them.</p>" });

    const story5 = await storage.createMotivationalStory({
      title: "Lessons from the Battle of Badr",
      slug: "lessons-from-the-battle-of-badr",
      description: "How the first decisive battle of Islam teaches timeless lessons about faith, strategy, unity, and reliance on Allah — applicable to every challenge we face today.",
      content: "The Battle of Badr wasn't just a military encounter — it was a defining moment that established principles of faith, courage, and divine trust that continue to guide Muslims fourteen centuries later.",
      category: "Islamic History & Lessons",
      published: true,
    });
    await storage.createMotivationalLesson({ storyId: story5.id, title: "Against All Odds", orderIndex: 0, content: "<h2>Against All Odds</h2><p>In the second year of Hijrah, 313 Muslims stood facing an army of over 1,000 well-equipped Quraysh warriors at the wells of Badr. The Muslims had 70 camels and only 2 horses between them. By every worldly measure, they should have been defeated before the battle even began.</p><p>But the Prophet Muhammad ﷺ did not measure success by worldly standards. On the night before the battle, he stood in prayer, raising his hands to the sky with such intensity that his cloak fell from his shoulders. Abu Bakr RA picked it up and gently placed it back, saying, 'O Messenger of Allah, your supplication to your Lord is sufficient.'</p><p>The lesson here transcends military strategy: when you have done everything within your power and placed your trust in Allah, the size of the challenge before you becomes irrelevant. <em>'How many a small group has overcome a large group by the permission of Allah. And Allah is with the patient.'</em> (Quran 2:249)</p>" });
    await storage.createMotivationalLesson({ storyId: story5.id, title: "Consultation and Unity", orderIndex: 1, content: "<h2>Consultation and Unity</h2><p>Before taking any strategic position, the Prophet ﷺ consulted his companions — demonstrating the Islamic principle of shura (consultation). When al-Hubab ibn al-Mundhir, an Ansari companion with local knowledge, suggested a different strategic position near the water wells, the Prophet ﷺ immediately accepted his advice.</p><p>This moment reveals profound leadership wisdom: even the Messenger of Allah ﷺ, who received divine revelation, valued the input and expertise of his community. True Islamic leadership is not about unilateral decisions but about harnessing collective wisdom while maintaining clear direction.</p><p>The unity displayed at Badr was also remarkable. Muhajiroon (emigrants from Makkah) and Ansar (helpers of Madinah) fought side by side, putting aside tribal identities for a shared purpose. Sa'd ibn Mu'adh spoke for the Ansar with words that still stir the heart: 'Go where Allah directs you. We are with you. Even if you led us to the sea, we would plunge into it with you.'</p><p>In our modern lives, this teaches us that success in any endeavor — whether a community project, a business venture, or a family challenge — requires both consultation with those who have knowledge and the unity that comes from shared purpose.</p>" });
    await storage.createMotivationalLesson({ storyId: story5.id, title: "Victory Through Tawakkul", orderIndex: 2, content: "<h2>Victory Through Tawakkul</h2><p>The victory at Badr was decisive and astonishing. Fourteen Muslims were martyred, while the Quraysh lost seventy warriors and seventy more were taken prisoner. Allah Himself commemorated this event in the Quran: <em>'You did not kill them, but it was Allah who killed them. And you did not throw when you threw, but it was Allah who threw.'</em> (Quran 8:17)</p><p>This verse contains one of the most powerful spiritual lessons in Islam: the concept of tawakkul — trusting in Allah while taking action. The companions did fight, they did throw, they did strategize. But the ultimate cause of victory was Allah's will and support.</p><p>The Prophet ﷺ had prepared his men, chosen his position carefully, and planned his strategy. But he also spent the night in prayer, made du'a until his cloak fell, and trusted that the outcome was ultimately in Allah's hands. This dual approach — maximum effort combined with complete reliance on Allah — is the essence of tawakkul.</p><p>For us today, Badr teaches that we should never neglect either dimension: prepare thoroughly for your exams, your job interview, your business plan — then place your trust in Allah for the outcome. The combination of human effort and divine reliance is the recipe for success that Badr established for all time.</p><p>As the Prophet ﷺ taught: <em>'Tie your camel, then put your trust in Allah.'</em> (Tirmidhi)</p>" });

    console.log("Motivational stories seeded successfully");
  }

  await seedStoryParts();
}

async function seedStoryParts() {
  const storySlugsToParts: {
    slug: string;
    parts: {
      title: string;
      summary: string;
      coverImage: string;
      pages: string[];
    }[];
  }[] = [
    {
      slug: "abu-bakr-the-truthful-companion",
      parts: [
        {
          title: "Al-Siddiq: The First to Believe",
          summary: "Abu Bakr was the closest companion of the Prophet ﷺ and the first adult male to accept Islam — earning the title al-Siddiq, 'The Truthful', for his immediate and unwavering belief.",
          coverImage: "/images/category-sahaba.png",
          pages: [
            `<p>Abu Bakr al-Siddiq, known as "The Truthful," was the closest companion of Prophet Muhammad ﷺ and the first adult male to embrace Islam. His story is one of unwavering faith, incredible sacrifice, and gentle leadership that continues to inspire millions around the world.</p>
<h2>A Man of Honesty and Wisdom</h2>
<p>Before Islam, Abu Bakr ibn Abi Quhafa was a highly respected merchant in Mecca. His knowledge of genealogy was encyclopedic, his business practices impeccably honest, and his character so gentle that people naturally gravitated toward him. He was one of the most beloved figures in Meccan society — not for his wealth, but for his integrity.</p>
<p>When the Prophet Muhammad ﷺ first shared the message of Islam with him privately, Abu Bakr did not hesitate, waver, or ask for time to consider. He accepted Islam immediately — an act of faith so complete and instantaneous that it earned him the title <em>al-Siddiq</em>, meaning the one who confirms the truth absolutely, without reservation.</p>`,
            `<h2>The Great Sacrifice</h2>
<p>Abu Bakr's devotion to Islam went far beyond words. He understood that faith must be expressed through action, and he channeled his considerable wealth toward the liberation of those suffering for their belief in Allah.</p>
<p>Among the enslaved Muslims he freed was Bilal ibn Rabah, an Ethiopian slave whose master tortured him by placing heavy stones on his chest under the blazing Meccan sun, demanding he renounce Islam. Bilal's only response was <em>Ahad, Ahad</em> — "One, One" — affirming the oneness of God. Abu Bakr purchased Bilal's freedom and set him free, and Bilal would go on to become the first muezzin (caller to prayer) in Islam.</p>
<p>The Prophet ﷺ once said: "No wealth has ever benefited me more than the wealth of Abu Bakr." When Abu Bakr heard this, he wept and said: "I and my wealth are only for you, O Messenger of Allah." His response captures the essence of his devotion — a complete and joyful surrender of everything for the sake of his faith.</p>`,
          ],
        },
        {
          title: "The Companion in the Cave",
          summary: "When the Prophet ﷺ was commanded to migrate from Mecca to Medina, Abu Bakr was chosen as his sole companion — their journey together becoming one of the most celebrated events in Islamic history.",
          coverImage: "/images/category-sahaba.png",
          pages: [
            `<p>The migration (Hijrah) from Mecca to Medina in 622 CE was one of the most dangerous journeys ever undertaken. The Quraysh had placed a bounty of 100 camels on the Prophet's head — alive or dead. For Abu Bakr, being chosen as the Prophet's sole companion on this life-threatening journey was the greatest honor of his life.</p>
<h2>The Cave of Thawr</h2>
<p>To evade the search parties, the Prophet ﷺ and Abu Bakr sought refuge in the Cave of Thawr for three days. The Quraysh search parties came close — so close that Abu Bakr could see their feet at the cave entrance. He trembled, not for his own life, but for the Prophet's safety.</p>
<p>"O Messenger of Allah," he whispered, "if one of them were to look at their feet, they would see us." The Prophet ﷺ responded with the words that the Quran would immortalize: <em>"Do not grieve, indeed Allah is with us."</em> (Quran 9:40)</p>
<p>According to classical accounts, a spider had spun a web across the cave entrance and a dove had nested there — signs that appeared to indicate the cave was uninhabited. Whether by miracle or simply by divine planning, the search parties passed on. The companions reached Medina safely, and a new chapter in Islamic history began.</p>`,
            `<h2>Lessons from the Migration</h2>
<p>The Hijrah of Abu Bakr and the Prophet ﷺ teaches us several profound lessons that remain relevant for every Muslim in every age.</p>
<p>First, <strong>preparation and action</strong>. The Prophet ﷺ did not simply pray and wait. He planned the route, chose a guide, arranged camels, and selected the timing carefully. Tawakkul (trust in Allah) does not mean abandoning effort — it means maximizing effort, then trusting Allah with the outcome.</p>
<p>Second, <strong>steadfast companionship</strong>. Abu Bakr's loyalty was absolute. When the Prophet ﷺ had to move secretly, Abu Bakr's family bore the risks without complaint. His daughter Asma' bint Abi Bakr carried food to them in the cave, tying the provisions with strips from her own belt — earning her the title <em>Dhat al-Nitaqayn</em>, "The One of Two Belts."</p>
<p>The bonds formed through shared trials for the sake of Allah are among the strongest in human experience. Abu Bakr and the Prophet ﷺ did not simply survive a dangerous journey together — they demonstrated what it means to walk the path of faith together, fully and completely.</p>`,
          ],
        },
        {
          title: "The Caliphate and Eternal Legacy",
          summary: "After the Prophet's passing, Abu Bakr stepped forward to lead the Muslim community through its most fragile moments — preserving the unity of Islam with wisdom, firmness, and a heart full of love.",
          coverImage: "/images/category-sahaba.png",
          pages: [
            `<p>On the day the Prophet Muhammad ﷺ passed away, the Muslim community was shattered with grief. Some companions could not accept the reality. It was Abu Bakr who stood before the people and delivered words of clarity that cut through the fog of sorrow:</p>
<blockquote><p><em>"Whoever worshipped Muhammad, know that Muhammad has died. And whoever worships Allah, know that Allah is alive and never dies."</em></p></blockquote>
<p>He then recited the verse: <em>"Muhammad is not but a messenger. Other messengers have passed before him. So if he was to die or be killed, would you turn back on your heels?"</em> (Quran 3:144). Upon hearing this, companions who had been unable to process the news finally found the words to mourn and move forward.</p>
<h2>The First Caliph</h2>
<p>Abu Bakr's two-year caliphate (632–634 CE) was marked by challenges that would have broken lesser leaders. Tribes across Arabia attempted to leave Islam after the Prophet's death — some stopped paying zakat, others followed false prophets. Abu Bakr's response was firm and decisive: he sent Muslim armies to bring the apostate tribes back to Islam, preserving the integrity of the nascent Muslim state.</p>
<p>Most significantly, Abu Bakr authorized the compilation of the Quran into a single written manuscript — a decision that would protect the word of Allah for all of human history. When Umar ibn al-Khattab first proposed this idea, Abu Bakr initially hesitated, saying: "How can I do something that the Prophet ﷺ did not do?" But after reflection and consultation, he recognized the necessity and commissioned Zayd ibn Thabit to lead the project.</p>`,
            `<h2>A Heart Full of Love</h2>
<p>What makes Abu Bakr's story so enduring is not just his political or military legacy — it is the quality of his heart. He was known for weeping often during prayer. He was known for his tenderness with the weak and poor. Despite being the Caliph, he continued to personally milk the goats of his elderly neighbors as he had done before assuming leadership.</p>
<p>The Prophet ﷺ said: <em>"The most merciful of my ummah toward my ummah is Abu Bakr."</em> (Tirmidhi). This mercy expressed itself in countless ways — in how he led, how he spoke, and how he treated those under his care.</p>
<p>Abu Bakr al-Siddiq passed away in 634 CE at the age of 63, the same age as the Prophet ﷺ. He was buried beside the Prophet in the room of Aisha RA. In his will, he asked that his burial shroud be the simple garment he had worn during his life — he wanted no special treatment in death, just as he had sought no special privilege in life.</p>
<p>His legacy is a reminder that the greatest among us are not necessarily the most powerful or the most visible — but those who serve Allah and serve His creation with the most sincere and loving hearts.</p>`,
          ],
        },
      ],
    },
    {
      slug: "khadijah-the-first-believer",
      parts: [
        {
          title: "The Remarkable Merchant",
          summary: "Before Islam, Khadijah bint Khuwaylid was one of the most successful and respected merchants in Mecca, known as al-Tahira — The Pure One — for her unimpeachable character.",
          coverImage: "/images/category-prophets.png",
          pages: [
            `<p>Khadijah bint Khuwaylid was born into the noble Qurayshi clan of Asad around 555 CE in Mecca. She grew up in a household that valued both commerce and character — a combination that would define her extraordinary life. When her father, Khuwaylid ibn Asad, died, she inherited his trading business and, rather than surrendering it to a male guardian as was customary, she took charge herself.</p>
<h2>A Pioneer in Business</h2>
<p>In a society that largely marginalized women in the public sphere, Khadijah defied all expectations. She built her father's modest trading enterprise into one of the most successful commercial operations in all of Arabia. Her caravans traveled from Mecca to Syria and Yemen, competing with — and often surpassing — those of the most powerful men in Mecca.</p>
<p>She did not achieve this through luck or inheritance alone. She was known for her sharp business acumen, her ability to identify trustworthy partners, and her reputation for absolute honesty in all transactions. The merchant community respected her not just as a woman in a man's world, but as the finest trader among them regardless of gender.</p>
<p>She earned the title <em>al-Tahira</em> — The Pure One — a name given to her by the people of Mecca in recognition of her impeccable personal character. In a city with many vices, Khadijah stood apart as someone who would not be drawn into them.</p>`,
            `<h2>The Partnership That Changed History</h2>
<p>When Khadijah needed a trustworthy manager for her trading caravan to Syria, she heard of a young man in Mecca known for his integrity — Muhammad ibn Abdullah, who had earned his own title among the people: <em>al-Amin</em>, The Trustworthy. She hired him to lead her caravan, sending her trusted servant Maysarah along to observe.</p>
<p>The journey was a remarkable success, both commercially and personally. Maysarah returned with stories not just of excellent profits, but of Muhammad's extraordinary character — his patience, his fairness with the traders they encountered, and certain signs that Maysarah described with wonder.</p>
<p>Khadijah was forty years old — a widow who had been married twice before and had children from those marriages. Muhammad was twenty-five. By all conventional calculations of the time, their pairing made no social sense. Yet Khadijah recognized in Muhammad something rare and precious, and she initiated a proposal through an intermediary.</p>
<p>Their marriage was a partnership of equals, built on mutual respect and shared values. For the next fifteen years, before the revelation came, Muhammad ﷺ would later say he never experienced a home more full of love and peace than the one he shared with Khadijah.</p>`,
          ],
        },
        {
          title: "The First Believer",
          summary: "When the weight of the first revelation shook the Prophet ﷺ to his core, it was Khadijah whose faith and love steadied him — and who became the very first Muslim, the cornerstone of Islam.",
          coverImage: "/images/category-prophets.png",
          pages: [
            `<p>It was the year 610 CE. Muhammad ﷺ had been in the habit of retreating to the Cave of Hira on Mount Nur, outside Mecca, for extended periods of solitude and reflection. On one fateful night during the month of Ramadan, something happened that would change the course of human history.</p>
<h2>The Night of the First Revelation</h2>
<p>The angel Jibreel appeared and embraced Muhammad ﷺ with a grip so tight it was painful, then released him and commanded: <em>"Iqra" — "Read" or "Recite."</em> Muhammad ﷺ, who did not know how to read, said, "I am not a reader." Three times this exchange repeated, and then came the first words of the Quran: <em>"Read in the name of your Lord who created. Created man from a clinging substance. Read, and your Lord is the Most Generous."</em> (Quran 96:1-3)</p>
<p>Muhammad ﷺ came home trembling, his heart pounding. He said to Khadijah: <em>"Cover me, cover me!"</em> She wrapped him in her cloak and held him until the trembling stopped. Then he told her what had happened, and said: <em>"I fear for myself."</em></p>
<p>What happened next defines Khadijah's greatness. In a moment that could have been met with confusion, doubt, or fear, she responded with words of serene certainty and absolute love. She said: <em>"Never! By Allah, Allah will never disgrace you. You maintain the ties of kinship, you bear the burden of the weak, you earn for the poor, you honor your guests, and you assist those who are afflicted with calamities."</em></p>`,
            `<h2>She Believed Without Hesitation</h2>
<p>Khadijah's response to Muhammad's first revelation was not merely emotional comfort — it was a theological declaration. She recognized, based on her deep knowledge of her husband's character, that a man of such integrity and goodness could not be touched by anything evil. What had come to him must be divine.</p>
<p>She took him to her cousin Waraqah ibn Nawfal, a Christian scholar who had studied the scriptures. Waraqah listened to Muhammad's account and said: "This is the Namus (the angel of revelation) that was sent to Moses. I wish I were young and could live up to the time when your people will turn you out." He confirmed that what had come to Muhammad was prophethood.</p>
<p>When the formal call to Islam came, Khadijah did not hesitate, deliberate, or seek additional confirmation. She became the first person — the first human being — to embrace Islam. Before Abu Bakr, before Ali, before any of the companions who would become legends in Islamic history, it was Khadijah who said <em>La ilaha ill-Allah, Muhammadur Rasulullah</em> — There is no god but Allah, and Muhammad is His messenger.</p>
<p>The Prophet ﷺ would later say: <em>"She believed in me when people disbelieved, she trusted me when people rejected me, and she helped me with her wealth when people deprived me."</em> (Ahmad). These words, spoken years after her death, reveal the profound gratitude and love he carried for her throughout his life.</p>`,
          ],
        },
        {
          title: "Years of Sacrifice & Legacy",
          summary: "Khadijah stood with the Prophet ﷺ through the most brutal years of persecution, sacrificing everything she possessed, and passed away as the most beloved woman in the Prophet's heart — a status that endured for the rest of his life.",
          coverImage: "/images/category-prophets.png",
          pages: [
            `<p>As Islam began to spread in Mecca, the Quraysh opposition intensified. By 616 CE, the leaders of Mecca imposed a total social and economic boycott on the Muslims and the entire Banu Hashim clan. For three long years, they were confined to a valley outside Mecca — Shi'b Abi Talib — cut off from trade, social interaction, and even food supplies.</p>
<h2>The Great Sacrifice</h2>
<p>Khadijah, who had once been the wealthiest woman in Mecca, endured this boycott alongside her husband and the nascent Muslim community. The wealth she had accumulated over decades of careful trade — the wealth that had sustained the early Muslim community and freed enslaved believers — was now largely depleted in service of the cause she believed in.</p>
<p>She was no longer young. The deprivations of the boycott — the hunger, the exposure to the elements, the stress — took a severe toll on her health. Yet historical accounts tell us that she never complained. She had made her choice consciously and completely, and she lived with that choice with full conviction.</p>
<p>When the boycott finally ended after three years, Khadijah emerged weakened. Within a short time — in the year 619 CE, which the Prophet ﷺ would call <em>Am al-Huzn</em>, the Year of Sorrow — Khadijah passed away. She was approximately 65 years old. The Prophet ﷺ prepared her grave with his own hands.</p>`,
            `<h2>A Love That Outlasted Death</h2>
<p>The Prophet Muhammad ﷺ grieved deeply for Khadijah. Years after her death, he would still speak of her with profound love and reverence. When someone would send a gift to the Prophet's household, he would often set aside a portion and say: "Send this to Khadijah's friends." When he slaughtered a sheep, he would say: "Send some to Khadijah's companions."</p>
<p>His later wife Aisha RA admitted that she was never more jealous of any woman than she was of Khadijah — not because Khadijah was alive, but because of the place she occupied in the Prophet's heart after her death. The Prophet ﷺ said of her: <em>"She believed in me when no one else did, she accepted Islam when people rejected me, she helped and comforted me when there was no one else to lend me support."</em></p>
<p>Allah Himself honored Khadijah. The Prophet ﷺ told her: <em>"Jibreel came to me and said: 'Give Khadijah the glad tidings of a palace of jewels in Paradise, in which there is neither noise nor toil.'"</em> (Bukhari)</p>
<p>Khadijah bint Khuwaylid was the Mother of the Believers, the first Muslim, the first supporter of the Prophet ﷺ, and a woman whose story continues to inspire Muslims across the world. In her life we find a model of faith that does not waver, love that does not diminish under pressure, and courage that does not flinch in the face of sacrifice. She was — and remains — truly extraordinary.</p>`,
          ],
        },
      ],
    },
    {
      slug: "rumi-the-poet-of-divine-love",
      parts: [
        {
          title: "The Scholar's Awakening",
          summary: "Jalaluddin Rumi was a respected theologian and scholar before a transformative encounter with the wandering mystic Shams of Tabriz awakened in him a depth of love and spiritual passion that would become one of humanity's great literary legacies.",
          coverImage: "/images/category-awliya.png",
          pages: [
            `<p>Jalaluddin Rumi was born on September 30, 1207, in Balkh — a city then part of the Khorasan region of the Persian Empire, in present-day Afghanistan. He was born into a family of theologians and Islamic scholars; his father, Baha ud-Din Walad, was a respected Sufi mystic and teacher known as "Sultan of the Scholars."</p>
<h2>A Childhood of Learning and Migration</h2>
<p>Rumi's early years were marked by migration. The Mongol invasions were beginning to destabilize Central Asia, and the family left Balkh around 1215, embarking on a years-long journey westward. According to tradition, during their journey they stopped in Nishapur, where Rumi as a young boy met the great Persian poet Attar, who recognized something extraordinary in the child and gifted him his book <em>Asrar Nama</em> (The Book of Secrets). The encounter planted a seed that would flower decades later.</p>
<p>The family eventually settled in Konya (in present-day Turkey), then the capital of the Sultanate of Rum — from which Rumi took his name, meaning "of Rome" or "of Rum." Konya would be Rumi's home for the rest of his life, and it is there that his transformation from scholar to mystic would take place.</p>`,
            `<h2>The Established Scholar</h2>
<p>After his father's death, Rumi completed his formal Islamic education in Aleppo and Damascus, studying jurisprudence and Islamic sciences under master scholars. He returned to Konya a fully trained religious scholar and took over his father's position as a teacher and spiritual guide.</p>
<p>For years, Rumi was exactly what the city of Konya knew him to be: a learned, pious, respected Islamic scholar. He taught hadith, jurisprudence, and theology. He gave legal rulings. He had thousands of students and disciples. By all external measures, he was at the pinnacle of his career.</p>
<p>But there was something more that Rumi was seeking — a deeper encounter with the divine reality behind the words and the laws. Something that scholarship alone could not provide. He had not yet found it. And then, in November 1244, everything changed when a wandering mystic named Shams ud-Din Muhammad of Tabriz arrived in Konya and the two men met.</p>
<p>What passed between them in their first encounter is debated by historians. Some say they spoke for hours or days in seclusion. What is certain is that when they emerged, Rumi was a fundamentally different person. The scholar had awakened to something beyond scholarship: the burning, consuming love of God that would pour out of him for the rest of his life as poetry of incomparable beauty.</p>`,
          ],
        },
        {
          title: "Divine Love and the Masnavi",
          summary: "After his transformation, Rumi composed the Masnavi — a vast sea of spiritual poetry in six volumes, often called 'the Quran in Persian' — exploring the themes of love, longing, and the soul's journey back to God.",
          coverImage: "/images/category-awliya.png",
          pages: [
            `<p>The friendship between Rumi and Shams of Tabriz was intense and transformative — and deeply controversial. Rumi's students and even members of his family grew jealous of the hold Shams seemed to have over their beloved teacher. In 1246, Shams disappeared — some accounts suggest he was driven away by Rumi's jealous disciples; other accounts, more troubling, suggest he was killed.</p>
<h2>The Wound That Became Poetry</h2>
<p>Rumi's grief at Shams's disappearance was overwhelming. But in a profound spiritual transformation, Rumi came to understand that what he loved in Shams was not the man himself but the divine light that shone through him. He realized that the Beloved — the divine presence he sought — was not external to himself but woven into the very fabric of reality.</p>
<p>This understanding unlocked the poetry. Rumi began to pour out ghazals (lyric poems), rubai'yat (quatrains), and eventually the monumental Masnavi — a river of spiritual verse that would flow for the rest of his life. He composed while walking, while dictating to his student Husam Chalabi, while in states of spiritual ecstasy that witnesses described as otherworldly.</p>
<p>The Masnavi begins with one of the most famous images in all of Persian literature: a reed flute, cut from its reed bed, crying with longing to return to its origin. The cry of the reed is the cry of every soul separated from God, longing to return. <em>"Listen to the reed and the tale it tells, how it sings of separation..."</em></p>`,
            `<h2>The Teaching of Divine Love</h2>
<p>At the heart of Rumi's teaching is a concept of love that transcends the ordinary. For Rumi, love is not merely an emotion — it is the fundamental force of the universe, the engine of creation, the path to God. He writes: <em>"Love is the sea of not-being, and the intellect stands on its shore."</em></p>
<p>This does not mean that Rumi rejected reason or Islamic law. He was deeply grounded in orthodox Islam and remained a practicing Muslim throughout his life. Rather, he recognized that the intellect, while essential, cannot by itself reach the deepest truths of spiritual reality. For that, one needs the fire of love — the passionate, consuming, transformative encounter with divine reality that he called <em>ishq</em>.</p>
<p>The Masnavi is structured as a series of stories within stories, parables, and spiritual discourses — a format drawn from the traditions of classical Islamic teaching. Through tales of a lion and a hare, a merchant and a parrot, Moses and a shepherd, Rumi explores the deepest questions of human existence: Why are we here? What is our relationship to God? How do we overcome the ego that separates us from our true nature?</p>
<p>One of his most famous teachings is on the role of hardship: <em>"The wound is the place where the Light enters you."</em> Difficulty, loss, and suffering are not obstacles to spiritual growth — they are the very instruments through which the soul is refined and opened to God's grace.</p>`,
          ],
        },
        {
          title: "Eternal Legacy",
          summary: "More than 750 years after his death, Rumi remains one of the best-selling poets in the world. His teachings on love, the soul, and the divine continue to speak across cultures, religions, and centuries — a testament to the universality of his message.",
          coverImage: "/images/category-awliya.png",
          pages: [
            `<p>Jalaluddin Rumi passed away on December 17, 1273, in Konya. He was 66 years old. The night of his death, he had reportedly described his own passing with characteristic Sufi imagery — not as an ending but as a wedding night (<em>shab-e arus</em>), the soul's reunion with its divine Beloved after long separation.</p>
<h2>The Mevlevi Order</h2>
<p>After Rumi's death, his son Sultan Walad formalized his father's spiritual community into the Mevlevi Order — known in the West as the Whirling Dervishes. The iconic practice of the Sema, the meditative spinning ceremony, is a form of active dhikr (remembrance of God), in which the dervish turns the right palm upward to receive divine grace and the left palm downward to transmit it to the earth.</p>
<p>The turning represents the rotation of the planets around the sun, the rotation of the electrons around the nucleus — the fundamental motion of the universe. In spinning, the dervish attempts to align himself with the movement of all creation, surrendering the ego to the divine will. The Mevlevi Order, based in Konya, continued Rumi's teachings for centuries and spread across the Ottoman Empire and beyond.</p>`,
            `<h2>A Poet for All of Humanity</h2>
<p>Today, Rumi is one of the best-selling poets in the United States and the English-speaking world — a remarkable achievement for a 13th-century Persian-language Sufi mystic. His poetry has been translated into dozens of languages and quoted by political leaders, musicians, artists, and spiritual teachers of every tradition.</p>
<p>Some Muslims have expressed concern that in popular Western culture, Rumi is often presented divorced from his Islamic context — as a universal mystic rather than as a Muslim scholar deeply rooted in the Quran and the Sunnah. This concern is valid: Rumi's poetry is saturated with Quranic references and hadith, and he himself never ceased to be a practicing Muslim teacher.</p>
<p>Yet perhaps there is also something remarkable in the breadth of Rumi's appeal: that a man who spent his life seeking God in the tradition of Islam produced work that speaks to the deepest spiritual longings of people across every tradition. His message — that love is the fundamental reality of existence, that the soul longs for reunion with its divine source, that the path requires the dissolution of the ego in the fire of that love — is one that resonates wherever there are human hearts that seek something beyond the material world.</p>
<p>As Rumi himself wrote: <em>"Out beyond ideas of wrongdoing and rightdoing, there is a field. I'll meet you there."</em></p>`,
          ],
        },
      ],
    },
    {
      slug: "miracles-that-shaped-history",
      parts: [
        {
          title: "The Spring of Zamzam",
          summary: "One of the most enduring miracles in Islamic tradition — the spring that burst forth under the feet of baby Ishmael in the desert, and has flowed continuously for thousands of years to this day.",
          coverImage: "/images/category-karamat.png",
          pages: [
            `<p>Hagar (Hajar) was a woman of extraordinary faith. Left alone with her infant son Ishmael (Ismail) in a barren, waterless valley — the valley that would become Mecca — with only a small supply of dates and water, she faced what appeared to be a death sentence for herself and her child.</p>
<h2>Running Between the Hills</h2>
<p>As the water ran out and her baby cried from thirst, Hagar did not sit in despair. She ran. She climbed the hill of Safa, looked for help or water, saw nothing, then ran to the hill of Marwa, climbed it, looked again. Seven times she ran back and forth between these two hills — an act of desperate maternal love and unshakeable faith that Allah would not abandon those who trusted in Him.</p>
<p>This act of running — the Sa'y — is commemorated by every Muslim who performs Hajj or Umrah to this day. When millions of pilgrims walk (or jog) between Safa and Marwa, they are walking in the footsteps of a woman who trusted God absolutely in the face of what seemed like certain death. Her faith has been enshrined in one of Islam's most essential rituals.</p>`,
            `<h2>The Miracle Beneath His Feet</h2>
<p>According to tradition, as baby Ishmael kicked his feet on the ground in distress, water burst forth from the earth — a spring that would become one of the most famous in human history: the Well of Zamzam.</p>
<p>Hagar, seeing this miracle, began containing the water with her hands and saying <em>"Zam! Zam!"</em> — meaning "stop, stop!" — which some scholars suggest gave the well its name. An alternative etymology connects it to the Arabic for "abundant water."</p>
<p>The spring attracted birds, which attracted a passing tribe — the tribe of Jurhum — who, seeing signs of water and life in an otherwise barren valley, approached Hagar and asked permission to settle nearby. She agreed, on the condition that the water rights belonged to her. And so a community began to form around the miracle of Zamzam — the community from which the holy city of Mecca would eventually grow.</p>
<p>Zamzam continues to flow to this day. Scientific analysis has confirmed that its water has unique mineral properties unlike other water sources in the region. Hundreds of millions of Muslims have drunk from it and carried it home as a blessing. It remains one of the most tangible, ongoing miracles in Islamic history — a spring that has never run dry in thousands of years.</p>`,
          ],
        },
        {
          title: "The Night Journey: Isra and Mi'raj",
          summary: "In a single night, the Prophet Muhammad ﷺ was transported from Mecca to Jerusalem, and then ascended through the seven heavens — meeting the prophets and receiving the commandment of five daily prayers directly from Allah.",
          coverImage: "/images/category-karamat.png",
          pages: [
            `<p>The year of the Isra and Mi'raj — the Night Journey and Ascension — is traditionally placed around 620–621 CE, during one of the most difficult periods of the Prophet's mission. Khadijah, his beloved wife, had recently died. His uncle Abu Talib, his worldly protector, had also passed away. The Prophet had visited the city of Ta'if seeking support and had been driven out with stones. He was at a point of great personal and communal suffering.</p>
<h2>Jerusalem in a Night</h2>
<p>In this context of trial and difficulty, Allah honored His Prophet with one of the most extraordinary events in human history. One night, the angel Jibreel came and transported the Prophet ﷺ on the Buraq — a creature described as white, between the size of a mule and a donkey, whose stride reached as far as its eye could see — from the Masjid al-Haram in Mecca to the Masjid al-Aqsa in Jerusalem.</p>
<p>At al-Aqsa, the Prophet ﷺ was met by the assembled souls of the prophets — Abraham (Ibrahim), Moses (Musa), Jesus (Isa), and many others. The Prophet ﷺ led them all in prayer, demonstrating the continuity of divine guidance through the ages and the Prophet's position as the seal and leader of all prophets.</p>
<p>The Quran commemorated this journey in the very first verse of Surah al-Isra: <em>"Exalted is He who took His Servant by night from al-Masjid al-Haram to al-Masjid al-Aqsa, whose surroundings We have blessed, to show him of Our signs. Indeed, He is the Hearing, the Seeing."</em> (Quran 17:1)</p>`,
            `<h2>The Ascension Through the Heavens</h2>
<p>From Jerusalem, the Prophet ﷺ ascended through the seven heavens — a journey of spiritual elevation that no human before or since has undertaken in the same manner. At each level of heaven, he met the prophets whose souls reside there: Adam in the first heaven, John and Jesus in the second, Joseph in the third, Idris in the fourth, Aaron in the fifth, Moses in the sixth, and Abraham in the seventh.</p>
<p>The Prophet ﷺ was shown the realities of Paradise and Hell — glimpses of the ultimate destinations that await humanity. And finally, at a place of proximity to Allah that the Quran describes as <em>"two bow-lengths or closer"</em> (Quran 53:9), the commandment of prayer was given: fifty prayers per day for the Muslim community.</p>
<p>On the way down, Moses ﷺ urged the Prophet ﷺ to return and ask for a reduction, knowing from his experience with the Israelites how difficult prayer could be for people. Multiple times the Prophet ﷺ returned, and each time the number was reduced, until the final commandment was five daily prayers — but with the reward of fifty.</p>
<h2>The Meaning of the Journey</h2>
<p>The Isra and Mi'raj is not merely a miraculous event — it is a theological statement. It affirms the continuity between Islam and the previous prophetic traditions. It establishes the centrality of prayer in Muslim life. And it demonstrates that Allah's response to His servant's difficulty is not abandonment, but elevation — closeness, honor, and the gift of direct communication.</p>
<p>When the Prophet ﷺ reported the journey to the Quraysh of Mecca, many mocked him. Abu Bakr, when told, simply said: "If he said it, it is true" — earning his title al-Siddiq. The Mi'raj remains one of the most celebrated events in the Islamic calendar, commemorated every year on the 27th of Rajab.</p>`,
          ],
        },
        {
          title: "Miracles of the Prophets",
          summary: "Throughout Islamic history, prophets and the righteous were granted extraordinary signs — from the staff of Moses to the speaking of Jesus in the cradle — each miracle perfectly calibrated to address the intellectual and spiritual challenges of its time.",
          coverImage: "/images/category-karamat.png",
          pages: [
            `<p>In Islamic theology, a miracle (<em>mu'jizah</em>) given to a prophet is a divine sign that serves a specific purpose: to prove the authenticity of the prophet's mission to the people of his time. Each miracle is tailored to the dominant intellectual and cultural context in which it appears.</p>
<h2>The Staff of Moses</h2>
<p>The Pharaoh of Egypt surrounded himself with the greatest magicians of the ancient world — and magic was the dominant form of what passed for "impossible" in that culture. When Moses ﷺ was sent to Pharaoh with the message of monotheism, his miracles were calibrated to this context: the staff that transformed into a serpent, the hand that gleamed white, the parting of the Red Sea.</p>
<p>The Quran describes how the magicians, when they witnessed Moses's staff swallowing all their serpents, prostrated immediately: <em>"They said, 'We believe in the Lord of Moses and Aaron.'"</em> (Quran 20:70). Their expertise in magic made them uniquely qualified to recognize that what Moses had done could not be explained by human technique — it could only be divine.</p>
<p>The miracle was not magic — it was a demonstration of divine power that surpassed the best that human achievement could offer, precisely to make its divine origin undeniable to those most qualified to evaluate it.</p>`,
            `<h2>The Quran: The Eternal Miracle</h2>
<p>The miracle given to Prophet Muhammad ﷺ was calibrated to a culture that prized poetry and linguistic mastery above almost all other achievements. The Arabs of the 7th century competed in literary excellence; the greatest poems were hung in the Kaaba as tributes to linguistic achievement. It was in this context that the Quran appeared.</p>
<p>The Quran challenges humanity directly: <em>"And if you are in doubt about what We have revealed to Our servant, then produce a surah like it and call upon your witnesses other than Allah, if you should be truthful."</em> (Quran 2:23). The Arabs — who were the greatest masters of the very language the Quran was delivered in — could not meet this challenge. Some of the greatest poets of the age embraced Islam when they heard its words, recognizing that its literary perfection transcended what any human could produce.</p>
<p>Unlike the miracles of previous prophets, which were specific events witnessed by specific people at specific times, the Quran endures. It is the living miracle, present for every generation. Its challenge remains open: produce something like it. Fourteen centuries later, no one has met that challenge.</p>
<p>The Quran is not just a book of religious law or historical narrative — it is itself the primary evidence for the truth of Islam's message, a miracle that speaks to the deepest capacities of human intelligence and spiritual perception. As the Prophet ﷺ said: <em>"Every prophet was given a miracle to make his people believe. What I was given is the Quran, and I hope to have the most followers on the Day of Judgment."</em> (Bukhari)</p>`,
          ],
        },
      ],
    },
    {
      slug: "treaty-of-hudaybiyyah",
      parts: [
        {
          title: "The Journey to Mecca",
          summary: "In 628 CE, the Prophet ﷺ set out with 1,400 companions to perform Umrah at the Kaaba — carrying no weapons, demonstrating peaceful intentions — only to find their path blocked by the Quraysh at Hudaybiyyah.",
          coverImage: "/images/category-history.png",
          pages: [
            `<p>It was the sixth year after the Hijrah — 628 CE in the Gregorian calendar. Prophet Muhammad ﷺ had a dream in which he and his companions entered Mecca peacefully and performed Umrah (the lesser pilgrimage) at the Kaaba. For Muslims, the Prophet's dreams were a form of revelation, and this dream was understood as a sign that the time had come to attempt the pilgrimage.</p>
<h2>A Pilgrimage of Peace</h2>
<p>The Prophet ﷺ set out from Medina with approximately 1,400 companions — men and women. Critically, they traveled without weapons of war, carrying only the small swords that travelers typically wore for self-defense. They drove sacrificial animals with them — camels and goats marked for sacrifice at the pilgrimage. This was an unmistakable signal: this was a religious mission, not a military expedition.</p>
<p>The Quraysh of Mecca, however, were alarmed. The growing strength of the Muslim community in Medina represented an existential challenge to their authority and their control over Mecca — the religious and commercial center of Arabia. They sent an armed force to block the Muslims at Hudaybiyyah, on the outskirts of Mecca.</p>`,
            `<h2>The Blocked Path</h2>
<p>When the Prophet ﷺ received news of the Quraysh blockade, he explored alternative routes to Mecca. The Muslim caravan navigated difficult terrain to try to reach the city by another path, but they were blocked at every turn. Finally, the Prophet ﷺ made camp at Hudaybiyyah and sent emissaries to negotiate with the Quraysh.</p>
<p>The negotiations were tense. The Quraysh sent their own emissaries to the Muslim camp — and some returned deeply impressed by what they saw. Urwah ibn Mas'ud al-Thaqafi, one of the Quraysh representatives, observed how the companions rushed to catch any water that fell from the Prophet's ablutions, how they never raised their voices in his presence, how they watched over him with a devotion that he had never seen in any court or council.</p>
<p>He reported back to the Quraysh: "I have seen Chosroes in his kingdom, Caesar in his kingdom, and the Negus in his kingdom, but I have never seen any king among his people like Muhammad among his companions." Despite this report, the Quraysh leadership remained opposed to allowing the Muslims entry to Mecca that year.</p>
<p>The Prophet ﷺ then sent Uthman ibn Affan — whose clan connections in Mecca made him a suitable diplomat — to negotiate directly with the Quraysh leadership. While Uthman was in Mecca, a rumor spread in the Muslim camp that he had been killed. This triggered one of the most significant moments of the entire episode.</p>`,
          ],
        },
        {
          title: "The Pledge and the Treaty",
          summary: "When news spread that Uthman had been killed, the Prophet ﷺ called his companions to a pledge of loyalty unto death — the Bay'at al-Ridwan, so beloved by Allah that He revealed Quranic verses in its honor.",
          coverImage: "/images/category-history.png",
          pages: [
            `<p>The rumor of Uthman's death spread through the Muslim camp at Hudaybiyyah like fire. For the companions, this was not just the news of a colleague's death — it meant the Quraysh had killed their emissary, a man they had sent in good faith for peaceful negotiations. If true, this was an act of war.</p>
<h2>The Bay'at al-Ridwan</h2>
<p>The Prophet ﷺ sat beneath a tree — traditionally identified as an acacia or a lotus tree — and one by one, his 1,400 companions came and pledged their allegiance to him. They pledged not to flee, to fight to the death if necessary, to remain loyal to the Prophet ﷺ and the cause of Islam regardless of the consequences.</p>
<p>This pledge is known as the <em>Bay'at al-Ridwan</em> — the Pledge of Good Pleasure. Allah honored it with direct Quranic revelation: <em>"Allah was pleased with the believers when they pledged allegiance to you under the tree. He knew what was in their hearts, so He sent down serenity upon them and rewarded them with an imminent conquest."</em> (Quran 48:18)</p>
<p>The dignity of this moment was so great that the companions who participated in it were accorded special status in Islamic tradition. The Prophet ﷺ himself held the place of Uthman in the pledge — his right hand representing Uthman's, as if Uthman himself had made the pledge. (Uthman was, in fact, alive and unharmed.)</p>`,
            `<h2>The Terms of the Treaty</h2>
<p>With the Pledge having been made and negotiations resuming, the Quraysh sent Suhayl ibn Amr to finalize a treaty. The terms Suhayl demanded seemed deeply unfavorable to the Muslims:</p>
<ul>
<li>The Muslims would return to Medina this year without performing Umrah</li>
<li>The following year, they could come for three days but Meccans would not meet with them</li>
<li>Any Muslim who fled to Medina from Mecca would be returned; any Muslim who went to Mecca from Medina would not be returned</li>
<li>There would be a ten-year cessation of hostilities</li>
</ul>
<p>The companions were devastated. Umar ibn al-Khattab later said it was one of the most difficult moments of his life as a Muslim — he could not understand how the Prophet ﷺ could accept such conditions, which appeared to humiliate the Muslims and favor the Quraysh. He approached Abu Bakr: "Is he not the Messenger of Allah? Are we not Muslims? Are they not polytheists? Why should we accept this humiliation in our religion?"</p>
<p>Abu Bakr's response was calm and certain: "Stick to his commands. I bear witness that he is the Messenger of Allah." The Prophet ﷺ signed the treaty. The companions sacrificed their animals at Hudaybiyyah and returned to Medina without entering Mecca.</p>`,
          ],
        },
        {
          title: "The Clear Victory",
          summary: "Allah revealed that Hudaybiyyah was a 'clear victory' — and within two years, its wisdom became undeniable: it opened the door to peace, to the rapid spread of Islam, and ultimately to the peaceful conquest of Mecca itself.",
          coverImage: "/images/category-history.png",
          pages: [
            `<p>On the journey back to Medina, Allah revealed Surah al-Fath — the Chapter of Victory. Its opening words must have startled the companions who were still processing the difficult terms of the treaty: <em>"Indeed, We have given you a clear victory."</em> (Quran 48:1)</p>
<h2>Understanding the Victory</h2>
<p>How could a treaty that seemed to favor the Quraysh be called a clear victory? The wisdom became apparent within two years.</p>
<p>First, the treaty created conditions of peace that allowed Islam to spread through direct human contact rather than military conflict. In the two years between Hudaybiyyah and the opening of Mecca, more people embraced Islam than in the previous twenty years of the Prophet's mission combined. Khalid ibn al-Walid — who would become one of the greatest military commanders in history — embraced Islam during this period. Amr ibn al-As embraced Islam. The doors of dialogue were opened that war had kept shut.</p>
<p>Second, the treaty gave the Prophet ﷺ the diplomatic freedom to expand relationships with other tribes and kingdoms. He sent letters to the Byzantine emperor, the Persian emperor, the Negus of Ethiopia, and other rulers, inviting them to Islam. The period of relative peace enabled a diplomatic expansion of the Muslim community's reach that military activity alone could never have achieved.</p>`,
            `<h2>The Opening of Mecca</h2>
<p>In 630 CE — just two years after Hudaybiyyah — the Quraysh violated the terms of the treaty by attacking an allied tribe of the Muslims. The treaty was effectively nullified. The Prophet ﷺ marched on Mecca with 10,000 companions — the same people who had been turned away at Hudaybiyyah with 1,400.</p>
<p>The Quraysh had no military response. Mecca was opened without significant bloodshed. The Prophet ﷺ entered as a conqueror and proceeded immediately to the Kaaba, which had been filled with idols by the Quraysh. He removed the idols one by one, reciting: <em>"Truth has come, and falsehood has departed. Indeed, falsehood is always bound to depart."</em> (Quran 17:81)</p>
<p>Then he turned to the assembled Quraysh — many of whom had persecuted him and his companions for twenty years, who had driven him from his hometown, who had tried to have him killed — and asked: "What do you expect from me?" They said: "Kindness and generosity, from a noble brother and the son of a noble brother." The Prophet ﷺ said: "Go, for you are free."</p>
<p>The general amnesty that followed the opening of Mecca was unprecedented in the ancient world. A conqueror who had every right to exact revenge chose instead to forgive entirely. And it was the Treaty of Hudaybiyyah — the "clear victory" that had seemed like a defeat — that had created the conditions for this merciful and bloodless triumph. Allah's plan, incomprehensible to human eyes in the moment, proved sublime in its wisdom.</p>`,
          ],
        },
      ],
    },
  ];

  for (const storyData of storySlugsToParts) {
    const story = await storage.getStoryBySlug(storyData.slug);
    if (!story) continue;

    const existingParts = await storage.getStoryParts(story.id);
    if (existingParts.length > 0) continue;

    for (let pi = 0; pi < storyData.parts.length; pi++) {
      const p = storyData.parts[pi];
      const part = await storage.createStoryPart({
        storyId: story.id,
        title: p.title,
        summary: p.summary,
        coverImage: p.coverImage,
        videoUrl: null,
        audioUrl: null,
        orderIndex: pi,
      });

      for (let gi = 0; gi < p.pages.length; gi++) {
        await storage.createStoryPage({
          partId: part.id,
          content: p.pages[gi],
          orderIndex: gi,
        });
      }
    }
  }

  console.log("Story parts seeded successfully");

  // Seed default footer pages if none exist
  const [footerPageCount] = await db.select({ count: count() }).from(footerPages);
  if (footerPageCount.count === 0) {
    await storage.createFooterPage({
      title: "About Us",
      slug: "about-us",
      content: `Stories of Light is a website dedicated to sharing authentic and inspiring stories from Islamic history, designed for English-speaking audiences around the world.

Our mission is to make the rich heritage of Islamic civilization accessible, engaging, and meaningful for everyone — whether you are a lifelong Muslim, someone exploring Islam, or simply a lover of history and great stories.

We believe that the stories of the Companions of the Prophet, the righteous scholars, and the great figures of Islamic history contain timeless lessons of courage, faith, wisdom, and mercy. By bringing these stories to life through careful writing, audio narrations, and curated books, we hope to inspire a new generation of readers.

All content on Stories of Light is sourced from authentic Islamic scholarship. We take care to present stories accurately, respectfully, and in a way that honors the legacy of those we write about.

If you have questions, feedback, or would like to contribute, please reach out to us. We would love to hear from you.

Thank you for visiting Stories of Light. May these stories illuminate your heart and strengthen your connection to the rich Islamic tradition.`,
      orderIndex: 0,
      published: true,
    });

    await storage.createFooterPage({
      title: "Privacy Policy",
      slug: "privacy-policy",
      content: `At Stories of Light, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website.

Information We Collect

When you create an account on Stories of Light, we collect basic information such as your name, email address, and username. We use this information solely to provide you with access to the website's features, such as bookmarks and reading progress.

We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. Your information is used only to operate and improve the website.

Cookies and Usage Data

We may use cookies to enhance your browsing experience and remember your preferences (such as dark/light mode). These cookies do not contain personal information and can be disabled in your browser settings.

We may collect anonymous usage data to understand how visitors use our website, such as which pages are most visited. This data is used only to improve our content and services.

Third-Party Services

Stories of Light may display advertisements through third-party advertising services. These services may use cookies to serve relevant ads based on your visit to our website. We recommend reviewing the privacy policies of these third-party services.

Data Security

We take reasonable measures to protect your personal information from unauthorized access, alteration, or disclosure. However, no method of transmission over the internet is 100% secure.

Your Rights

You may request to view, update, or delete your personal information at any time by contacting us. You may also delete your account through your account settings.

Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be posted on this page. We encourage you to review this page periodically to stay informed about how we protect your information.

If you have any questions about this Privacy Policy, please contact us.

Last updated: 2025`,
      orderIndex: 1,
      published: true,
    });

    console.log("Default footer pages seeded");
  }

  // Seed initial duas
  const [duaCount] = await db.select({ count: count() }).from(duas);
  if (duaCount.count === 0) {
    const DUAS_SEED = [
      {
        dua: { title: "Dua Before Sleeping", slug: "dua-before-sleeping", category: "Daily Duas", description: "The supplication to recite before going to sleep each night, placing our spirit in Allah's care.", published: true, orderIndex: 0 },
        parts: [{ title: "Bismika Allahumma – Before Sleeping", arabicText: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", translation: "In Your name, O Allah, I die and I live.", explanation: "This dua is narrated by al-Bara' ibn 'Azib (may Allah be pleased with him) in Sahih al-Bukhari. The Prophet ﷺ instructed believers to recite it just before sleeping.\n\nVirtues & Benefits:\nSleep in Islamic tradition is considered a minor form of death — the soul departs the body and is returned by Allah's will upon waking. By saying \"Bismika Allahumma amoto wa ahya\" (In Your name, O Allah, I die and I live), we acknowledge complete reliance on Allah.\n\nThis dua is a beautiful act of tawakkul (trust in Allah). It reminds us that our life and death are entirely in Allah's hands. Reciting it each night creates an awareness that every sleep may be our last — encouraging us to sleep in a state of righteousness and sincerity.\n\nThe Prophet ﷺ also recommended sleeping in a state of wudu (ritual purity), lying on the right side, and reciting Ayatul Kursi before this dua for complete protection throughout the night.", orderIndex: 0 }]
      },
      {
        dua: { title: "Dua Upon Waking Up", slug: "dua-upon-waking-up", category: "Daily Duas", description: "The first words to say when you open your eyes each morning — a declaration of gratitude to Allah for giving us life again.", published: true, orderIndex: 1 },
        parts: [{ title: "Alhamdulillah – Upon Waking Up", arabicText: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", translation: "All praise is for Allah who gave us life after causing us to die, and unto Him is the resurrection.", explanation: "Narrated in Sahih al-Bukhari and Muslim, this dua should be the very first thing said when waking from sleep.\n\nVirtues & Benefits:\nJust as sleep is a minor death, waking is a form of resurrection. Allah returns the soul to the body each morning as a mercy and a gift. Saying this dua upon waking is an expression of shukr (gratitude) — acknowledging that we only live because Allah willed it.\n\nThe mention of النُّشُورُ (the resurrection) at the start of each day keeps believers mindful of the Day of Judgment, fostering righteous intentions throughout the day. It sets the spiritual tone for all actions that follow.\n\nThe Prophet ﷺ would begin his day with dhikr and this dua is the foundation of morning remembrance.", orderIndex: 0 }]
      },
      {
        dua: { title: "Dua When Leaving the Home", slug: "dua-leaving-home", category: "Daily Duas", description: "A short but powerful supplication to say every time you step out of your home, seeking Allah's guidance and protection.", published: true, orderIndex: 2 },
        parts: [{ title: "Bismillahi Tawakkaltu – Leaving Home", arabicText: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ", translation: "In the name of Allah, I place my trust in Allah, and there is no might and no power except with Allah.", explanation: "Narrated in Sunan Abu Dawud and at-Tirmidhi (who graded it sahih/hasan), this dua is recommended to say every time one leaves the home.\n\nVirtues & Benefits:\nThe Prophet ﷺ said that when a person says this dua upon leaving their home, it is said to them: \"You are guided, defended, and protected.\" The shaytan withdraws and another shaytan says to him: \"How can you deal with a man who has been guided, defended, and protected?\"\n\nThis hadith shows the immense protection offered by this simple yet powerful dua. It is a declaration of three great realities:\n1. تَوَكَّلْتُ عَلَى اللَّهِ (I place my trust in Allah) — trusting that Allah manages all affairs\n2. لاَ حَوْلَ (No might) — we have no power to avoid evil without Allah\n3. وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ (No power except with Allah) — all strength and ability come from Him alone\n\nReciting this dua daily builds a spiritual shield, reminding us that we venture into the world under Allah's protection.", orderIndex: 0 }]
      },
      {
        dua: { title: "Dua When Entering the Home", slug: "dua-entering-home", category: "Daily Duas", description: "Invite blessings and peace into your home by reciting this dua each time you enter.", published: true, orderIndex: 3 },
        parts: [{ title: "Bismillah – Entering the Home", arabicText: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلَجِ وَخَيْرَ الْمَخْرَجِ، بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا", translation: "O Allah, I ask You for goodness upon entering and goodness upon leaving. In Allah's name we enter, in Allah's name we leave, and upon Allah our Lord we place our trust.", explanation: "This dua is narrated by Abu Dawud and is recommended each time one enters their home.\n\nVirtues & Benefits:\nThe home is considered a place of privacy, rest, and family — a sanctuary that Allah has blessed. By beginning the entry with the name of Allah, we invite His presence and blessings into our living space.\n\nThe Prophet ﷺ also recommended greeting the household with salaam when entering, even if alone. This combination of salam and bismillah makes the home a place where angels are comfortable and shaytan is kept at bay.\n\nThe mention of both entering and leaving (المولج والمخرج) shows that we ask Allah for goodness in both our private life at home and our public life outside — a comprehensive dua for all of one's daily movement.", orderIndex: 0 }]
      },
      {
        dua: { title: "Dua Before Eating", slug: "dua-before-eating", category: "Daily Duas", description: "The essential Bismillah before every meal — a simple act that transforms eating into worship.", published: true, orderIndex: 4 },
        parts: [{ title: "Bismillah – Before Eating", arabicText: "بِسْمِ اللَّهِ", translation: "In the name of Allah.", explanation: "The Prophet Muhammad ﷺ said: \"When any one of you eats, let him mention the name of Allah at the beginning. If he forgets to mention Allah at the beginning, let him say: 'Bismillah fi awwalihi wa akhirihi' (In the name of Allah at its beginning and its end).\" (Abu Dawud, Tirmidhi — sahih)\n\nVirtues & Benefits:\nSaying Bismillah before eating is a sunnah that transforms the act of eating — a basic human need — into an act of worship. It is an acknowledgement that the food we consume comes from Allah's provision (rizq).\n\nThe Prophet ﷺ taught us that when we forget to say Bismillah at the beginning, we should say: بِسْمِ اللَّهِ فِي أَوَّلِهِ وَآخِرِهِ (Bismillahi fi awwalihi wa akhirihi). This shows the importance of this dua even if remembered mid-meal.\n\nSaying Bismillah also protects the food from shaytan sharing in it. As the Prophet ﷺ said: \"When a man enters his house and mentions Allah upon entering and upon eating, the shaytan says: 'There is no place for you to spend the night and no supper.'\" (Muslim)", orderIndex: 0 }]
      },
      {
        dua: { title: "Dua After Eating", slug: "dua-after-eating", category: "Daily Duas", description: "Express gratitude to Allah after every meal with this beautiful supplication of praise.", published: true, orderIndex: 5 },
        parts: [{ title: "Alhamdulillah – After Eating", arabicText: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ", translation: "All praise is for Allah who fed us and gave us drink, and made us Muslims.", explanation: "Narrated in Sunan Abu Dawud and at-Tirmidhi, this dua is recommended to say after finishing a meal.\n\nVirtues & Benefits:\nThis dua is a comprehensive expression of shukr (gratitude). It thanks Allah for three of His greatest gifts:\n1. الطعام (Food) — Physical nourishment for the body\n2. الشراب (Drink) — Water and sustenance for life\n3. الإسلام (Islam) — The greatest gift of guidance and true faith\n\nThe inclusion of \"and made us Muslims\" at the end of a food-related dua is profound. It reminds us that the greatest provision Allah has given us is not material food, but the spiritual nourishment of Islam. Every meal becomes an opportunity to reflect on the blessings of faith.\n\nAlternatively, one may say: الْحَمْدُ لِلَّهِ حَمْداً كَثِيراً طَيِّباً مُبَارَكاً فِيهِ غَيْرَ مَكْفِيٍّ وَلاَ مُوَدَّعٍ وَلاَ مُسْتَغْنىً عَنْهُ رَبَّنَا — which the Prophet ﷺ recited as narrated in Sahih al-Bukhari.", orderIndex: 0 }]
      },
      {
        dua: { title: "Dua When Entering the Masjid", slug: "dua-entering-masjid", category: "Daily Duas", description: "The supplication to recite as you step into the house of Allah, opening the doors to His infinite mercy.", published: true, orderIndex: 6 },
        parts: [{ title: "Entering the Mosque – Seeking Mercy", arabicText: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", translation: "O Allah, open the gates of Your mercy for me.", explanation: "Narrated by Muslim, Abu Dawud, and others, this dua is recommended as one steps into the mosque, beginning with the right foot.\n\nVirtues & Benefits:\nThe masjid is called بيت الله — the house of Allah. When entering this blessed space, we ask Allah to open His doors of mercy to us. The mosque is not merely a building; it is a place where angels descend, prayers are answered, and the believer is surrounded by divine mercy.\n\nThe Prophet ﷺ would enter with his right foot and recite this dua. He ﷺ also recommended sending salawat (blessings) upon him before this dua, as narrated in Abu Dawud:\nالصَّلاَةُ وَالسَّلاَمُ عَلَى رَسُولِ اللَّهِ\n\nEntering the masjid in this state of consciousness — aware that you are stepping into Allah's house seeking His mercy — transforms every visit into a spiritual journey. The believer who enters with this intention leaves the mosque purified.", orderIndex: 0 }]
      },
      {
        dua: { title: "Dua When Leaving the Masjid", slug: "dua-leaving-masjid", category: "Daily Duas", description: "As you leave the house of Allah, ask Him for His bounty and provision in the world outside.", published: true, orderIndex: 7 },
        parts: [{ title: "Leaving the Mosque – Seeking Bounty", arabicText: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", translation: "O Allah, I ask You of Your bounty.", explanation: "Narrated by Muslim, this dua is recited when leaving the mosque, stepping out with the left foot.\n\nVirtues & Benefits:\nThere is beautiful symmetry in the duas for entering and leaving the masjid. When entering, we ask for Allah's mercy (رحمة) — the spiritual gift. When leaving, we ask for His bounty (فضل) — which encompasses provision, success, and good in this world.\n\nThe mosque represents the spiritual realm; the outside world represents the material realm where we work and interact. This dua is a reminder that as we leave the house of worship to return to daily life, we carry our dependence on Allah with us. We ask that our worldly endeavors be blessed and successful.\n\nThe Prophet ﷺ was consistent in these duas, teaching us that every entry and exit from the mosque should be an act of worship. This also reinforces the idea that worship doesn't end when we leave the masjid — our entire life is an act of ibadah when done with the right intention.", orderIndex: 0 }]
      },
      {
        dua: { title: "Dua Before Entering the Bathroom", slug: "dua-entering-bathroom", category: "Daily Duas", description: "Seek Allah's protection from impurity and evil before entering the bathroom with this concise supplication.", published: true, orderIndex: 8 },
        parts: [{ title: "Protection from Evil – Entering Bathroom", arabicText: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ", translation: "O Allah, I seek refuge with You from all evil and evil-doers (male and female devils).", explanation: "Narrated in Sahih al-Bukhari and Muslim, this dua is to be said before entering the bathroom or any private place.\n\nVirtues & Benefits:\nThe bathroom is considered a place where shaytan and evil jinn are present, as they dwell in places of impurity. This dua is a shield that protects the believer before entering such a place.\n\nالخبث (al-khubuthu) refers to male evil jinn, and الخبائث (al-khaba'ith) refers to female evil jinn. By seeking refuge from both, the believer is comprehensively protected.\n\nPractical guidelines from the Sunnah:\n- Say this dua before entering (not inside)\n- Enter with the left foot\n- Cover the private parts as soon as possible\n- Avoid speaking inside the bathroom\n- Avoid facing or turning your back to the qibla\n- Exit with the right foot\n- Upon exiting, say: غُفْرَانَكَ (Ghufranaka — I seek Your forgiveness)\n\nThese etiquettes transform even this basic human act into one of mindfulness and worship.", orderIndex: 0 }]
      },
      {
        dua: { title: "Sayyidul Istighfar – Master Dua for Forgiveness", slug: "sayyidul-istighfar", category: "Duas for Forgiveness", description: "The greatest and most comprehensive dua of forgiveness, which the Prophet ﷺ called the Master of all Istighfar.", published: true, orderIndex: 9 },
        parts: [{ title: "Sayyidul Istighfar – The Complete Supplication", arabicText: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ", translation: "O Allah, You are my Lord. There is no god but You. You created me and I am Your slave. I am committed to Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your blessing upon me, and I acknowledge my sin. Forgive me, for there is none who forgives sins except You.", explanation: "Narrated by Shaddad ibn Aws (may Allah be pleased with him) in Sahih al-Bukhari, this is considered the most comprehensive dua of forgiveness in the entire Sunnah.\n\nVirtues & Benefits:\nThe Prophet Muhammad ﷺ said: \"The master of supplication for forgiveness is to say: [this dua]. Whoever says it with certainty during the day, and dies that day before the evening, he will be among the people of Paradise. And whoever says it with certainty during the night, and dies before the morning, he will be among the people of Paradise.\"\n\nThis hadith is remarkable — saying Sayyidul Istighfar once daily with sincerity is a means of earning a place in Jannah.\n\nBreakdown of the Dua's Meaning:\n1. اللَّهُمَّ أَنْتَ رَبِّي — Acknowledging Allah's lordship\n2. لَا إِلَهَ إِلَّا أَنْتَ — Affirming Tawheed (oneness of Allah)\n3. خَلَقْتَنِي وَأَنَا عَبْدُكَ — Acknowledging our servitude and created nature\n4. أَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ — Commitment to the covenant with Allah as best we can\n5. أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ — Seeking refuge from our own evil deeds\n6. أَبُوءُ لَكَ بِنِعْمَتِكَ — Acknowledging Allah's blessings\n7. أَبُوءُ لَكَ بِذَنْبِي — Confessing our sins\n8. فَاغْفِرْ لِي — Asking for forgiveness\n\nThis dua is recommended morning and evening and is the crown of all istighfar.", orderIndex: 0 }]
      },
    ];

    for (const { dua, parts } of DUAS_SEED) {
      const created = await storage.createDua({ ...dua });
      for (const part of parts) {
        await storage.createDuaPart({ duaId: created.id, ...part });
      }
    }
    console.log("Initial duas seeded (10 duas)");
  }
}
