const fs = require('fs');
const path = require('path');

const chatsFilePath = path.join(__dirname, 'data', 'chats.json');
const messagesFilePath = path.join(__dirname, 'data', 'messages.json');

// Utility to read JSON file or return default value
function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading file:', filePath, err);
    return defaultValue;
  }
}

// Utility to write JSON file
function writeJsonFile(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing file:', filePath, err);
  }
}

// Get chats for a user
function getChatsForUser(username) {
  const chats = readJsonFile(chatsFilePath, []);
  // Filter chats where user is participant
  return chats.filter(chat => chat.participants.includes(username));
}

// Get messages between two users
function getMessagesBetweenUsers(user1, user2) {
  const messages = readJsonFile(messagesFilePath, []);
  return messages.filter(
    msg =>
      (msg.from === user1 && msg.to === user2) ||
      (msg.from === user2 && msg.to === user1)
  );
}

// Add a new message
function addMessage(from, to, text, fileMetadata = null) {
  const messages = readJsonFile(messagesFilePath, []);
  const newMessage = {
    id: Date.now().toString(),
    from,
    to,
    text,
    timestamp: new Date().toISOString(),
    read: false,
  };
  if (fileMetadata) {
    newMessage.fileUrl = fileMetadata.fileUrl;
    newMessage.fileType = fileMetadata.fileType;
  }
  messages.push(newMessage);
  writeJsonFile(messagesFilePath, messages);
  return newMessage;
}

// Mark messages as read from 'from' to 'to'
function markMessagesAsRead(from, to) {
  const messages = readJsonFile(messagesFilePath, []);
  let updated = false;
  messages.forEach(msg => {
    if (msg.from === from && msg.to === to && !msg.read) {
      msg.read = true;
      updated = true;
    }
  });
  if (updated) {
    writeJsonFile(messagesFilePath, messages);
  }
  return updated;
}

module.exports = {
  getChatsForUser,
  getMessagesBetweenUsers,
  addMessage,
  markMessagesAsRead,
};
