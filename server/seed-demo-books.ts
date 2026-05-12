import { storage, db } from "./storage";
import { books } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Seeding demo books with parts and pages...");

  const demoBooks = [
    {
      title: "The Forty Hadith of Imam Nawawi",
      slug: "forty-hadith-nawawi",
      author: "Imam al-Nawawi",
      description: "A timeless collection of forty-two hadiths that form the foundational pillars of Islamic knowledge and practice. Each hadith is a gateway to understanding the core of the Deen.",
      coverUrl: "https://m.media-amazon.com/images/I/51TRPfaXg6L._SY445_SX342_.jpg",
      category: "Hadith",
      type: "free" as const,
      published: true,
      averageRating: 4.8,
      totalRatings: 142,
      views: 3200,
    },
    {
      title: "The Lives of the Sahaba",
      slug: "lives-of-the-sahaba",
      author: "Muhammad Yusuf Kandhlawi",
      description: "An encyclopedic account of the lives, virtues, and sacrifices of the noble Companions of the Prophet ﷺ. A must-read for every Muslim seeking inspiration from the greatest generation.",
      coverUrl: "https://m.media-amazon.com/images/I/71Euh-3NKLL._AC_UF1000,1000_QL80_.jpg",
      category: "Seerah",
      type: "free" as const,
      published: true,
      averageRating: 4.9,
      totalRatings: 89,
      views: 2100,
    },
    {
      title: "Ihya Ulum al-Din (Revival of the Religious Sciences)",
      slug: "ihya-ulum-al-din",
      author: "Imam al-Ghazali",
      description: "One of the most celebrated works in Islamic literature. Al-Ghazali's monumental work covers every dimension of the Muslim's life — outward acts of worship, social transactions, and the inward purification of the soul.",
      coverUrl: "https://m.media-amazon.com/images/I/41byJUGjReL._SY445_SX342_.jpg",
      category: "Tazkiyah",
      type: "paid" as const,
      price: "$24.99",
      amazonAffiliateLink: "https://www.amazon.com/dp/0946621748",
      affiliateLink: "https://www.amazon.com/dp/0946621748",
      buyButtonLabel: "Buy on Amazon",
      published: true,
      averageRating: 4.9,
      totalRatings: 217,
      views: 5400,
    },
    {
      title: "Muhammad: His Life Based on the Earliest Sources",
      slug: "muhammad-martin-lings",
      author: "Martin Lings (Abu Bakr Siraj ad-Din)",
      description: "Widely regarded as the finest biography of the Prophet ﷺ in English. Drawing on classical Arabic sources, Lings weaves a narrative of rare spiritual depth and beauty that has moved readers of all faiths.",
      coverUrl: "https://m.media-amazon.com/images/I/71-u-JXqFNL._AC_UF1000,1000_QL80_.jpg",
      category: "Seerah",
      type: "paid" as const,
      price: "$18.99",
      amazonAffiliateLink: "https://www.amazon.com/dp/0946621330",
      affiliateLink: "https://www.amazon.com/dp/0946621330",
      buyButtonLabel: "Buy on Amazon",
      published: true,
      averageRating: 4.9,
      totalRatings: 385,
      views: 8700,
    },
  ];

  for (const bookData of demoBooks) {
    const existing = await db.select().from(books).where(eq(books.slug, bookData.slug));
    if (existing.length > 0) {
      console.log(`  Skipping "${bookData.title}" — already exists.`);
      continue;
    }

    const book = await storage.createBook(bookData as any);
    console.log(`  Created book: "${book.title}" (${book.type})`);

    if (book.slug === "forty-hadith-nawawi") {
      const part1 = await storage.createBookPart({
        bookId: book.id,
        title: "Part One: Faith and Intention",
        summary: "The first ten hadiths covering sincerity of intention, the pillars of Islam, and the foundations of faith.",
        orderIndex: 0,
      });
      await storage.createBookPage({ partId: part1.id, orderIndex: 0, content: `<h2>Hadith 1 — Actions Are by Intentions</h2>
<p class="arabic text-2xl text-center my-4">إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ</p>
<p>On the authority of Amir al-Mu'minin Abu Hafs Umar ibn al-Khattab (may Allah be pleased with him), who said: <em>I heard the Messenger of Allah ﷺ say:</em></p>
<blockquote class="border-l-4 border-green-600 pl-4 my-4 italic">"Actions are but by intentions, and every person shall have only that which he intended. Whoever emigrates for the sake of Allah and His Messenger, his emigration will be for the sake of Allah and His Messenger. And whoever emigrates for the sake of worldly gain or to marry a woman, then his emigration will be for whatever he emigrated for."</blockquote>
<p><strong>Related by:</strong> Bukhari and Muslim</p>
<h3 class="font-semibold text-lg mt-6">Commentary</h3>
<p>This hadith is considered the foundation of Islam. Scholars say: "This single hadith is one-third of knowledge." The actions of a person — prayer, fasting, giving charity, even speaking — are only accepted and rewarded according to what lies in the heart behind them.</p>
<p>Imam Shafi'i said that this hadith is one of the axes upon which the entire religion turns. If a person prays but intends only to be seen by others, they receive no reward. If they perform the smallest act solely for Allah's sake, they receive immense reward.</p>
<p><strong>Lesson:</strong> Before every act, renew your intention. Ask: "Am I doing this for Allah?" This single question, asked sincerely, transforms ordinary life into continuous worship.</p>` });
      await storage.createBookPage({ partId: part1.id, orderIndex: 1, content: `<h2>Hadith 2 — Islam, Iman, and Ihsan</h2>
<p>On the authority of Umar ibn al-Khattab (may Allah be pleased with him) who said:</p>
<blockquote class="border-l-4 border-green-600 pl-4 my-4 italic">"One day while we were sitting with the Messenger of Allah ﷺ, there appeared before us a man whose clothes were exceedingly white and whose hair was exceedingly black; no signs of journeying were to be seen on him and none of us knew him. He walked up and sat down by the Prophet ﷺ..."</blockquote>
<p>The man asked three great questions: <strong>What is Islam? What is Iman (faith)? What is Ihsan (excellence)?</strong></p>
<h3 class="font-semibold text-lg mt-6">The Prophet's ﷺ Answer</h3>
<p><strong>Islam</strong> is to testify that none has the right to be worshipped except Allah and that Muhammad is the Messenger of Allah, to establish the prayer, to give the Zakat, to fast during Ramadan, and to perform pilgrimage if you are able.</p>
<p><strong>Iman</strong> is to believe in Allah, His angels, His books, His messengers, and the Last Day, and to believe in divine destiny, both the good and the evil thereof.</p>
<p><strong>Ihsan</strong> is to worship Allah as though you are seeing Him, and if you cannot see Him, then indeed He sees you.</p>
<h3 class="font-semibold text-lg mt-6">Commentary</h3>
<p>This hadith is known as the "Mother of the Sunnah" — just as Surah al-Fatihah is the mother of the Quran. It outlines the entire structure of the religion: the outward acts (Islam), the inward beliefs (Iman), and the perfection of both in one's relationship with Allah (Ihsan).</p>` });

      const part2 = await storage.createBookPart({
        bookId: book.id,
        title: "Part Two: Character and Community",
        summary: "Hadiths on kindness to neighbors, removing harm from the path, and the rights of the Muslim community.",
        orderIndex: 1,
      });
      await storage.createBookPage({ partId: part2.id, orderIndex: 0, content: `<h2>Hadith 13 — No One Truly Believes Until...</h2>
<blockquote class="border-l-4 border-green-600 pl-4 my-4 italic">"None of you truly believes until he loves for his brother what he loves for himself."</blockquote>
<p><strong>Related by:</strong> Bukhari and Muslim</p>
<h3 class="font-semibold text-lg mt-6">Commentary</h3>
<p>This hadith establishes one of the most beautiful principles in Islam: the Muslim community is a single body. What you wish for yourself — health, wealth, guidance, happiness — you must also wish for your fellow believer.</p>
<p>Notice that the Prophet ﷺ did not say "until he treats his brother as he treats himself" — which is about outward action. He said "until he <em>loves</em>" — which goes to the deepest level of the heart.</p>
<p>This principle, if practiced sincerely, would eliminate envy, jealousy, and backbiting from the Muslim community entirely. The one who is genuinely happy when their brother succeeds, and genuinely wants good for others, has achieved something remarkable in their spiritual development.</p>
<p><strong>Practical Application:</strong> When you see someone else succeed — in business, in marriage, in knowledge — check your heart. Is there any tightening, any subtle wish that it were different? That is the moment to make du'a for them, sincerely, and push through any trace of envy.</p>` });
    }

    if (book.slug === "lives-of-the-sahaba") {
      const part1 = await storage.createBookPart({
        bookId: book.id,
        title: "Chapter 1: Abu Bakr al-Siddiq (رضي الله عنه)",
        summary: "The life, virtues, and legacy of the closest companion to the Prophet ﷺ and the first Caliph of Islam.",
        orderIndex: 0,
      });
      await storage.createBookPage({ partId: part1.id, orderIndex: 0, content: `<h2>Abu Bakr al-Siddiq: The Truthful</h2>
<p>His full name was Abdullah ibn Abi Quhafa ibn Amir ibn Amr al-Tamimi al-Qurashi. He was given the title <em>al-Siddiq</em> (the Truthful) by the Prophet ﷺ himself — an honor that placed him above all other Companions in the quality of his faith.</p>
<h3 class="font-semibold text-lg mt-6">His Early Life and Conversion</h3>
<p>Abu Bakr was born two years and six months after the Year of the Elephant — approximately 573 CE. He belonged to the noble tribe of Banu Taym, a respected branch of Quraysh. Before Islam, he was a successful merchant, known throughout Makkah for his integrity and generosity.</p>
<p>When the Prophet ﷺ received the first revelation and began calling people to Islam, Abu Bakr was among the very first to accept. He did not hesitate, did not ask for proof — he knew the Prophet ﷺ too well to doubt him for a moment. "I believe you," he said simply. And with those words, he became the first free adult male to embrace Islam.</p>
<p>The Prophet ﷺ later said: <em>"I never invited anyone to Islam except that he hesitated and wavered — except Abu Bakr. When I told him, he did not hesitate for even a moment."</em></p>
<h3 class="font-semibold text-lg mt-6">His Generosity in the Path of Allah</h3>
<p>Abu Bakr spent his entire fortune in the service of Islam. He purchased and freed enslaved Muslims who were being tortured for their faith — including Bilal ibn Rabah, whose haunting screams under the blazing desert sun have echoed through Islamic history ever since.</p>
<p>When the Prophet ﷺ called for contributions to equip the army for the Battle of Tabuk, Abu Bakr brought everything he owned. The Prophet ﷺ asked: "What have you left for your family?" Abu Bakr replied: "Allah and His Messenger."</p>` });
      await storage.createBookPage({ partId: part1.id, orderIndex: 1, content: `<h2>Abu Bakr: The Companion in the Cave</h2>
<p>Of all the moments in Abu Bakr's life, none is more famous than the Hijra — the migration from Makkah to Madinah. The Quraysh had plotted to assassinate the Prophet ﷺ, sending one young man from each tribe so that the blood-guilt would be distributed and the Banu Hashim could not seek revenge.</p>
<p>That night, the Prophet ﷺ left his house as the assassins waited outside. He recited the opening verses of Surah Ya-Sin and scattered dust over the heads of the men, who fell into a stupor and saw nothing. He then went to Abu Bakr's house, and together they slipped out of Makkah under cover of darkness.</p>
<h3 class="font-semibold text-lg mt-6">Three Days in the Cave of Thawr</h3>
<p>They took refuge in the Cave of Thawr, south of Makkah. The Quraysh searched everywhere and offered a reward of 100 camels for the Prophet's capture. When the searchers reached the mouth of the cave, Abu Bakr whispered in fear — not for himself, but for the Prophet ﷺ.</p>
<p>The Prophet ﷺ replied with words that became immortal: <em>"Do not grieve. Indeed, Allah is with us."</em> (Quran 9:40)</p>
<p>By the miraculous decree of Allah, a spider had spun its web across the cave entrance, and a dove had laid eggs there — convincing the searchers that no one could have entered. These are among the signs that demonstrate how Allah protects His Messenger and those who stand with him.</p>
<h3 class="font-semibold text-lg mt-6">His Khilafah</h3>
<p>When the Prophet ﷺ passed away in 632 CE, the Muslim community was in shock. Umar ibn al-Khattab stood up in the mosque, threatening to strike down anyone who said the Prophet had died. It was Abu Bakr who composed himself and addressed the community:</p>
<blockquote class="border-l-4 border-green-600 pl-4 my-4 italic">"O people! Whoever worshipped Muhammad, let him know that Muhammad has died. But whoever worshipped Allah — Allah is Ever-Living and will never die."</blockquote>
<p>He then recited: <em>"Muhammad is not but a messenger. Messengers have passed before him..."</em> (Quran 3:144). Hearing those words, Umar's legs gave way beneath him and the entire community wept — and understood.</p>` });

      const part2 = await storage.createBookPart({
        bookId: book.id,
        title: "Chapter 2: Umar ibn al-Khattab (رضي الله عنه)",
        summary: "The remarkable transformation of Umar — from fierce opponent to fierce defender of Islam — and his era as the second Caliph.",
        orderIndex: 1,
      });
      await storage.createBookPage({ partId: part2.id, orderIndex: 0, content: `<h2>Umar ibn al-Khattab: The Distinguisher</h2>
<p>Allah's Messenger ﷺ said: <em>"If there were to be a prophet after me, it would have been Umar ibn al-Khattab."</em> (Tirmidhi)</p>
<p>Before Islam, Umar was one of the most formidable opponents of the early Muslim community. Physically powerful, intellectually sharp, and deeply committed to the old ways of Quraysh, he was feared and respected in equal measure. When he set out one day with the explicit intention of killing the Prophet ﷺ, he was met instead by destiny.</p>
<h3 class="font-semibold text-lg mt-6">The Night Islam Entered His Heart</h3>
<p>On his way to find the Prophet ﷺ, Umar was diverted to his sister's house, where he discovered she and her husband had accepted Islam. Enraged, he struck his brother-in-law and then — when his sister stepped forward to protect her husband — struck her too. When he saw blood on her face, something shifted inside him.</p>
<p>He asked to see the pages they had been reading. After purifying himself, he read the opening verses of Surah Ta-Ha. By the time he reached the verse: <em>"Indeed, I am Allah — there is no god except Me, so worship Me and establish prayer for My remembrance"</em> (20:14) — his heart had cracked open. He went directly to the Prophet ﷺ and embraced Islam that same night.</p>
<p>The Prophet ﷺ raised his hands and cried: <em>"O Allah, strengthen Islam with the one you love more — Umar ibn al-Khattab or Abu Jahl!"</em> — and Allah had chosen Umar.</p>` });
    }

    if (book.slug === "ihya-ulum-al-din") {
      const part1 = await storage.createBookPart({
        bookId: book.id,
        title: "Book of Knowledge — Preview",
        summary: "The opening section on the obligation to seek knowledge, its categories, and the virtues of the scholar.",
        orderIndex: 0,
      });
      await storage.createBookPage({ partId: part1.id, orderIndex: 0, content: `<h2>The Obligation of Knowledge</h2>
<p>The Messenger of Allah ﷺ said: <em>"Seeking knowledge is an obligation upon every Muslim."</em></p>
<p>In the opening of this monumental work, Imam al-Ghazali — known as the Proof of Islam (Hujjat al-Islam) — begins with knowledge because it is the very foundation upon which all correct action rests. One cannot worship correctly without knowledge of how to worship. One cannot abstain from the forbidden without knowing what is forbidden.</p>
<p>He divides knowledge into two fundamental categories:</p>
<ul class="list-disc pl-6 space-y-2 my-4">
  <li><strong>Fard Ayn</strong> — Individual obligation: Knowledge that every single Muslim must acquire. This includes the essentials of belief (aqeedah), the rules of purification and prayer, the fundamentals of permissible and forbidden dealings, and the purification of the heart from the major spiritual diseases.</li>
  <li><strong>Fard Kifayah</strong> — Communal obligation: Knowledge that the Muslim community must have collectively. If enough people learn medicine, Islamic law, hadith sciences, etc., the obligation is fulfilled for all. If no one learns these sciences, the entire community bears the sin.</li>
</ul>
<p>Al-Ghazali's insight is that most Muslims of his era — and this remains deeply relevant — were so focused on the external sciences of fiqh (jurisprudence) that they neglected the internal sciences of the heart. A person might know the precise rulings on inheritance law while their heart is consumed by arrogance and love of worldly status — which, says al-Ghazali, is a far greater danger to their soul.</p>
<p class="bg-amber-50 border border-amber-200 rounded p-4 mt-4 text-sm"><strong>Note:</strong> This is a preview of the full text. Purchase the complete work to access all four volumes covering worship, social dealings, destructive qualities, and saving qualities of the soul.</p>` });

      const part2 = await storage.createBookPart({
        bookId: book.id,
        title: "Book of the Heart — Preview",
        summary: "Understanding the spiritual heart (qalb) — its nature, its diseases, and how to cure them.",
        orderIndex: 1,
      });
      await storage.createBookPage({ partId: part2.id, orderIndex: 0, content: `<h2>The Heart: Battlefield of the Soul</h2>
<p>Al-Ghazali writes: <em>"Know that what we mean by the heart is not the physical organ in the chest. The physicians and anatomists speak of that. What we mean is the subtle divine reality (latifah rabbaniyyah) that is the true self of the human being."</em></p>
<p>The heart, in the Islamic spiritual tradition, is the center of consciousness — the place where knowledge, intention, and moral character are formed. The Prophet ﷺ pointed to his chest and said: <em>"Taqwa (God-consciousness) is here."</em></p>
<h3 class="font-semibold text-lg mt-6">The Diseases of the Heart</h3>
<p>Al-Ghazali identifies the major diseases of the heart that the third volume (Muhlikat — The Destructive Qualities) addresses at length:</p>
<ul class="list-disc pl-6 space-y-2 my-4">
  <li><strong>Kibr (Arrogance)</strong> — Seeing oneself as superior to others, which is described as the root of Iblis's fall.</li>
  <li><strong>Hasad (Envy)</strong> — Disliking the blessings Allah has given to others, which the Prophet ﷺ said "eats away good deeds as fire eats wood."</li>
  <li><strong>Riya (Ostentation)</strong> — Performing acts of worship to be seen and praised by people.</li>
  <li><strong>Hub al-Dunya (Love of the World)</strong> — The attachment to worldly things as ultimate goods, which crowds out love of Allah.</li>
</ul>
<p class="bg-amber-50 border border-amber-200 rounded p-4 mt-4 text-sm"><strong>Note:</strong> This is a preview. The complete Ihya runs to four volumes with detailed cures for each spiritual disease. Purchase to access the full text.</p>` });
    }

    if (book.slug === "muhammad-martin-lings") {
      const part1 = await storage.createBookPart({
        bookId: book.id,
        title: "Part I: Arabia Before the Prophet — Preview",
        summary: "The world into which the Prophet ﷺ was born — the Arabian peninsula, the tribes, and the spiritual void that awaited a light.",
        orderIndex: 0,
      });
      await storage.createBookPage({ partId: part1.id, orderIndex: 0, content: `<h2>Arabia Before the Dawn</h2>
<p>Martin Lings opens his biography with a panoramic description of Arabia in the sixth century CE — a world poised on the edge of transformation it could not yet imagine.</p>
<p>The Arabian peninsula was a land of extreme contrasts. The Hijaz — the region of Makkah and Madinah — was not a land of grass and rivers but of rock and sand, blistered by heat during the day and startlingly cold at night. And yet it was here, in this harsh terrain far from the great empires of Persia and Byzantium, that the final and universal message of God would be revealed.</p>
<h3 class="font-semibold text-lg mt-6">The House of God in a Sea of Idols</h3>
<p>At the center of this world stood the Kaaba — the House of Allah, built by Ibrahim and his son Ismail. But by the sixth century, the sacred house had become surrounded by three hundred and sixty idols. The pure monotheism of Ibrahim had been overlaid, generation by generation, with the polytheism of jahiliyyah (the Age of Ignorance).</p>
<p>Yet even in that age, there were the hunafa — individuals who had preserved something of Ibrahim's original monotheism, who refused to bow to idols, who sensed that the religion of their forefathers was wrong but did not yet have the revelation to replace it. Waraqah ibn Nawfal was one such man. Zayd ibn Amr ibn Nufayl was another — he would stand with his back to the Kaaba and say: "O Allah, if I knew how You wished to be worshipped, I would worship You so. But I do not know." He died before the revelation came.</p>
<p>It was into this world — hungry for truth — that Muhammad ibn Abdullah ﷺ was born in the Year of the Elephant, approximately 570 CE.</p>
<p class="bg-amber-50 border border-amber-200 rounded p-4 mt-4 text-sm"><strong>Note:</strong> This is a preview of one of the most celebrated biographies of the Prophet ﷺ in the English language. Purchase the full text to read the complete life — from his blessed birth to his return to his Lord.</p>` });

      const part2 = await storage.createBookPart({
        bookId: book.id,
        title: "Part II: The First Revelation — Preview",
        summary: "The night that changed history — the descent of the first verses of the Quran in the Cave of Hira.",
        orderIndex: 1,
      });
      await storage.createBookPage({ partId: part2.id, orderIndex: 0, content: `<h2>The Night of Power: The First Revelation</h2>
<p>For years before the first revelation, Muhammad ﷺ had felt a growing restlessness with the world around him. He would retreat to the Cave of Hira — a hollow in the peak of Jabal al-Nur ("the Mountain of Light") on the outskirts of Makkah — to think, to pray, to be alone with something he could not yet name.</p>
<p>Then came the night that divided all of human history.</p>
<p>It was the Night of Power in Ramadan, in the year 610 CE. The Angel Jibril appeared to him in the cave and embraced him with crushing force, then released him and commanded: <strong>"Iqra!"</strong> — "Read! Recite!"</p>
<p>"I cannot read," Muhammad ﷺ replied — for he had never been taught to read or write.</p>
<p>The angel embraced him a second time, and a third, and then recited:</p>
<blockquote class="border-l-4 border-green-600 pl-4 my-6 text-lg">
  <p class="arabic text-2xl mb-2">اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ</p>
  <p><em>"Read in the name of your Lord who created — Created man from a clinging substance. Read, and your Lord is the Most Generous — Who taught by the pen — Taught man that which he knew not."</em> (Quran 96:1–5)</p>
</blockquote>
<p>Muhammad ﷺ descended from the mountain, his heart trembling, and went to Khadijah. "Cover me, cover me," he said. She wrapped him in a garment and when he had calmed, he told her everything. She spoke words that have echoed through history ever since:</p>
<blockquote class="border-l-4 border-green-600 pl-4 my-4 italic">"By Allah, He will never disgrace you. You uphold the ties of kinship, you speak the truth, you bear people's burdens, you help the destitute, you are generous to your guest, and you assist the victims of calamity."</blockquote>
<p class="bg-amber-50 border border-amber-200 rounded p-4 mt-4 text-sm"><strong>Note:</strong> This is a preview. Purchase the full biography to read the complete story of the Hijra, the battles, the Companions, and the final years of the Prophet ﷺ as told by Martin Lings with unmatched spiritual sensitivity.</p>` });
    }

    console.log(`  Added parts and pages for "${book.title}"`);
  }

  console.log("\nDemo books seeding complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
