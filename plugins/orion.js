const axios = require("axios");

module.exports = {
    name: "autoreply",
    description: "Auto reply without prefix, like a human with typing mistakes",
    pattern: ".*",      // কোনো prefix লাগবে না, সব মেসেজে রেসপন্স দিবে
    fromMe: false,      // নিজের মেসেজে না
    async handler(conn, mek, m, { from, args, q, reply }) {
        try {
            const userText = m.text || q || "";

            if (!userText.trim()) return; // খালি মেসেজ এড়িয়ে যাবে

            // API তে পাঠানোর জন্য ইউজার ইনপুট
            const encodedText = encodeURIComponent(userText);

            // API কল (dreaded.site Malvin AI)
            const url = `https://api.dreaded.site/api/chatgpt?text=${encodedText}`;

            // API থেকে রেসপন্স নাও
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'application/json',
                }
            });

            if (!response.data || !response.data.result || !response.data.result.prompt) {
                return reply("দুঃখিত, আমি এখন তোমার প্রশ্নের উত্তর দিতে পারছি না। আবার চেষ্টা করো।");
            }

            let apiReply = response.data.result.prompt;

            // এখন, আমরা একটু মানুষি মিসটেক করার মতো এলোমেলো করে মেসেজে টাইপিং মিসটেক যোগ করব,
            // পরে ঠিক করে আসল রিপ্লাই দিবো

            // টাইপিং মিসটেক জেনারেটর ফাংশন (ছোট একটা)
            function addTypingMistake(text) {
                const words = text.split(" ");
                if (words.length < 2) return text;

                // একটা র্যান্ডম ওয়ার্ড চেঞ্জ করব
                const idx = Math.floor(Math.random() * words.length);

                // ওয়ার্ড থেকে একটা অক্ষর বদলাব
                let w = words[idx];
                if (w.length < 2) return text;

                let pos = Math.floor(Math.random() * (w.length - 1));
                let arr = w.split('');
                // Swap two adjacent chars (typing mistake)
                [arr[pos], arr[pos+1]] = [arr[pos+1], arr[pos]];
                words[idx] = arr.join('');

                return words.join(' ');
            }

            // টাইপিং মিসটেক যুক্ত মেসেজ
            const typoText = addTypingMistake(apiReply);

            // ধাপে ধাপে রিপ্লাই পাঠানো

            // ১. প্রথমে টাইপিং মিসটেক সহ মেসেজ পাঠাও
            await reply(typoText);

            // ২. ২ সেকেন্ড পরে আসল টেক্সট ঠিক করে পাঠাও
            setTimeout(() => {
                conn.sendMessage(from, { text: `\n✍️ Typing mistake → ঠিক করে বলছি:\n\n${apiReply}` }, { quoted: mek });
            }, 2000);

        } catch (error) {
            console.error("AutoReply Error:", error);
            reply("😔 দুঃখিত, কিছু ভুল হয়েছে। আবার চেষ্টা করো।");
        }
    }
};
