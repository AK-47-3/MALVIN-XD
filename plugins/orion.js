const axios = require("axios");
const { malvin } = require("../malvin");
// require("dotenv").config(); // এই লাইনটি এখন প্রয়োজন নেই কারণ আপনি dotenv ব্যবহার করছেন না

malvin({
    pattern: "(.*)", // এটি যেকোনো মেসেজ ম্যাচ করবে, অটো-রিপ্লাইয়ের জন্য
    desc: "Gemini API ব্যবহার করে প্রিফিক্স ছাড়াই মানুষের টাইপিং ভুলের মতো অটো-রিপ্লাই।",
    category: "ai",
    react: "🤖",
    filename: __filename,
    use: "চ্যাটে প্রিফিক্স ছাড়াই অটো-রিপ্লাই",
    fromMe: false, // নিজের মেসেজে রেসপন্স দিবে না
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const userText = (m.text || q || "").trim();

        // খালি বা খুব ছোট মেসেজ এড়িয়ে চলুন API কল সংরক্ষণ করতে এবং এটিকে আরও স্বাভাবিক দেখাতে।
        if (!userText || userText.length < 3) {
            return;
        }

        // --- আপনার API Key এখানে সরাসরি লেখা হয়েছে ---
        const apiKey = "AIzaSyDVdti41rOyMb_27uvJe-4KpLCxUiBkJWc"; // <<-- আপনার আসল Gemini API Key এখানে দিন!

        // এই চেকটি এখন অকেজো, কারণ আপনি apiKey সরাসরি দিয়েছেন।
        if (!apiKey) {
            console.error("❌ Gemini API কী সেট করা নেই। বট মালিককে জানান।");
            return reply("দুঃখিত, Gemini API কী সেট করা নেই। বট মালিককে জানান।");
        }

        const url = `https://api.dreaded.site/api/gemini/chat?key=${apiKey}&message=${encodeURIComponent(userText)}`;

        console.log("Gemini API এর জন্য অনুরোধ করা হচ্ছে:", url);

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Bot; Malvin-AI)',
                'Accept': 'application/json',
            }
        });

        console.log("Gemini API রেসপন্স:", response.data);

        if (!response.data || !response.data.reply) {
            return reply("দুঃখিত, আমি তোমার প্রশ্নের উত্তর দিতে পারছি না। আবার চেষ্টা করো।");
        }

        let apiReply = response.data.reply;

        function addTypingMistake(text) {
            if (typeof text !== 'string' || text.trim() === '') return text;

            const words = text.split(" ");
            if (words.length < 2) return text;

            const typoProbability = 0.3;
            if (Math.random() > typoProbability) {
                return text;
            }

            const idx = Math.floor(Math.random() * words.length);
            let w = words[idx];
            if (w.length < 3) return text;

            let arr = w.split('');
            let mistakeType = Math.floor(Math.random() * 3);

            switch(mistakeType) {
                case 0:
                    if (arr.length > 1) {
                        let pos = Math.floor(Math.random() * (arr.length - 1));
                        [arr[pos], arr[pos+1]] = [arr[pos+1], arr[pos]];
                    }
                    break;
                case 1:
                    if (arr.length > 1) {
                        let pos = Math.floor(Math.random() * arr.length);
                        arr.splice(pos, 1);
                    }
                    break;
                case 2:
                    const chars = "abcdefghijklmnopqrstuvwxyz";
                    let pos = Math.floor(Math.random() * (arr.length + 1));
                    let randomChar = chars[Math.floor(Math.random() * chars.length)];
                    arr.splice(pos, 0, randomChar);
                    break;
            }

            words[idx] = arr.join('');
            return words.join(' ');
        }

        const typoText = addTypingMistake(apiReply);

        await reply(typoText);

        setTimeout(async () => {
            const AI_IMG = 'https://files.catbox.moe/79tf9z.jpg'; // আপনার পছন্দের ছবি URL

            const formattedInfo = `🤖 *জেমিনি এআই বলছে:*\n\n${apiReply}`;

            await conn.sendMessage(from, {
                image: { url: AI_IMG },
                caption: formattedInfo,
                contextInfo: {
                    mentionedJid: [m.sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363402507750390@newsletter',
                        newsletterName: '*জেমিনি এআই*',
                        serverMessageId: 143
                    }
                }
            }, { quoted: mek });
        }, 2000);

    } catch (error) {
        console.error("অটো-রিপ্লাই জেমিনি ত্রুটি:", error);

        if (error.response) {
            console.log("ত্রুটি রেসপন্স ডেটা:", error.response.data);
            if (error.response.status === 401 || error.response.status === 403) {
                 return reply("❌ API কী-তে সমস্যা হয়েছে। সঠিক কী ব্যবহার করা হয়নি অথবা মেয়াদের বাইরে চলে গেছে।");
            } else if (error.response.status === 429) {
                 return reply("⏳ API রেট লিমিট অতিক্রম করেছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।");
            }
        }

        return reply(`❌ কিছু ভুল হয়েছে: ${error.message}\nঅনুগ্রহ করে পরে আবার চেষ্টা করুন।`);
    }
});