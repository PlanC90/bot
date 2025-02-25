import TelegramBot from 'node-telegram-bot-api';

// Replace with your actual Telegram Bot API token
const token = '7700368269:AAGCXJJ-Alq7bQGcyg2mk1JXeBi2MwHMEnI';

// URL of the JSON data
const dataUrl = 'https://test3-of9y.onrender.com/data/links.json';

// Image URL
const imageUrl = 'https://memex.planc.space/images/gorsel.jpg';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Store processed URLs to avoid duplicates
let processedUrls = new Set();

// Store group IDs
let groupIds = new Set();

// Store the last link
let lastLink = null;

// Function to fetch and process links
async function fetchAndProcessLinks() {
  try {
    const response = await fetch(dataUrl);
    const data = await response.json();

    if (!data || !Array.isArray(data.links)) {
      console.log('Invalid data format received.');
      return;
    }

    // Get the last link from the array
    if (data.links.length > 0) {
      lastLink = data.links[data.links.length - 1];
    }

    for (const link of data.links) {
      if (!processedUrls.has(link.url)) {
        // Format the message
        let message = `<b>New MemeX Community Link!</b>\\n\\n`;
        message += `<b>Username:</b> ${link.username}\\n`;
        message += `<b>Platform:</b> ${link.platform}\\n\\n`;
        message += `Support this post and claim your rewards!`;

        // Send the message to all known group chats
        groupIds.forEach(groupId => {
          bot.sendPhoto(groupId, imageUrl, {
            caption: message,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Link', url: link.url }]
              ]
            }
          });
        });

        // Add the URL to the processed set
        processedUrls.add(link.url);
      }
    }
  } catch (error) {
    console.error('Error fetching or processing data:', error);
  }
}

// Fetch and process links every 20 seconds
setInterval(fetchAndProcessLinks, 20000);

// Listen for the bot being added to a group
bot.on('new_chat_members', (msg) => {
  const chatId = msg.chat.id;
  if (!groupIds.has(chatId)) {
    groupIds.add(chatId);
    console.log(`Bot added to group: ${chatId}`);
  }
});

// Listen for /start command to collect group ID and send last link
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!groupIds.has(chatId)) {
    groupIds.add(chatId);
    console.log(`Group ID saved: ${chatId}`);
    bot.sendMessage(chatId, 'Welcome! This group ID has been saved.');
  } else {
    bot.sendMessage(chatId, 'Welcome! This group ID is already saved.');
  }

  if (lastLink) {
    // Format the message
    let message = `<b>Last MemeX Community Link!</b>\\n\\n`;
    message += `<b>Username:</b> ${lastLink.username}\\n`;
    message += `<b>Platform:</b> ${lastLink.platform}\\n\\n`;
    message += `Support this post and claim your rewards!`;

    bot.sendPhoto(chatId, imageUrl, {
      caption: message,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Link', url: lastLink.url }]
        ]
      }
    });
  } else {
    bot.sendMessage(chatId, 'No links have been processed yet.');
  }
});

console.log('Telegram bot is running...');
