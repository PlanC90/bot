import TelegramBot from 'node-telegram-bot-api';

// Replace with your actual Telegram Bot API token
const token = '7700368269:AAGCXJJ-Alq7bQGcyg2mk1JXeBi2MwHMEnI';

// URL of the JSON data
const dataUrl = 'https://test3-of9y.onrender.com/data/links.json';

// Image URL for task posts and /start command
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

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Filter links from today
    const todaysLinks = data.links.filter(link => link.timestamp.split('T')[0] === today);

    // Get the last link from today, if any
    if (todaysLinks.length > 0) {
      lastLink = todaysLinks[todaysLinks.length - 1];
    }

    if (lastLink && !processedUrls.has(lastLink.url)) {
      // Format the message
      let message = `✨ <b>New MemeX Community Link!</b> ✨\\n\\n`;
      message += `👤 <b>Username:</b> ${lastLink.username}\\n`;
      message += `🌐 <b>Platform:</b> ${lastLink.platform}\\n\\n`;
      message += `Support this post and claim your rewards!`;

      // Send the message to all known group chats
      groupIds.forEach(groupId => {
        bot.sendPhoto(groupId, imageUrl, {
          caption: message,
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Link', url: lastLink.url }]
            ]
          }
        })
        .catch(error => {
          console.error('Error sending message to group ${groupId}:', error);
        });
      });

      // Add the URL to the processed set
      processedUrls.add(lastLink.url);
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
  if (!groupIds.has(String(chatId))) {
    groupIds.add(String(chatId));
    console.log(`Bot added to group: ${chatId}`);
  }
});

// Listen for /start command to collect group ID and send welcome message
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!groupIds.has(String(chatId))) {
    groupIds.add(String(chatId));
    console.log(`Group ID saved: ${chatId}`);
  }

  if (lastLink) {
    // Send the welcome message with the specified image and button
    let welcomeMessage = `Welcome to MEMEX ARMY, @${msg.from.username}!\\n\\n`;
    welcomeMessage += `⭐ The latest task added by ${lastLink.username} on ${lastLink.platform}\\n`;
    welcomeMessage += `✅ Now support as a MemeX ARMY`;

    bot.sendPhoto(chatId, imageUrl, {
      caption: welcomeMessage,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Link', url: lastLink.url }]
        ]
      }
    })
    .catch(error => {
      console.error('Error sending /start message to group ${chatId}:', error);
    });
  } else {
    bot.sendMessage(chatId, 'No tasks have been processed yet for today. Please wait for the first task to be added.')
    .catch(error => {
      console.error('Error sending no tasks message to group ${chatId}:', error);
    });
  }
});

console.log('Telegram bot is running...');
