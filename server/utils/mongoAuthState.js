/**
 * MongoDB-backed auth state for Baileys.
 * Drop-in replacement for useMultiFileAuthState.
 * 
 * Stores creds and signal protocol keys in MongoDB so sessions
 * survive container restarts/redeploys.
 */
const WhatsAppAuth = require('../models/WhatsAppAuth');

/**
 * BufferJSON: handles serialization of Buffer objects to/from JSON.
 * Baileys keys contain Buffer objects that need special handling.
 */
const BufferJSON = {
  replacer: (key, value) => {
    if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
      return { __isBuffer: true, data: Buffer.from(value.data).toString('base64') };
    }
    if (Buffer.isBuffer(value)) {
      return { __isBuffer: true, data: value.toString('base64') };
    }
    return value;
  },
  reviver: (key, value) => {
    if (value && value.__isBuffer) {
      return Buffer.from(value.data, 'base64');
    }
    return value;
  },
};

function serialize(data) {
  return JSON.parse(JSON.stringify(data, BufferJSON.replacer));
}

function deserialize(data) {
  return JSON.parse(JSON.stringify(data), BufferJSON.reviver);
}

/**
 * Creates a MongoDB-backed auth state.
 * @param {string} sessionId - Unique session identifier (e.g. userId)
 * @returns {{ state, saveCreds }} - Compatible with Baileys makeWASocket
 */
async function useMongoDBAuthState(sessionId) {
  // Read a key from DB
  const readData = async (key) => {
    try {
      const doc = await WhatsAppAuth.findOne({ sessionId, key }).lean();
      if (!doc) return null;
      return deserialize(doc.value);
    } catch (e) {
      console.error(`[MongoAuth] Read error [${key}]:`, e.message);
      return null;
    }
  };

  // Write a key to DB
  const writeData = async (key, value) => {
    try {
      const serialized = serialize(value);
      await WhatsAppAuth.updateOne(
        { sessionId, key },
        { $set: { value: serialized } },
        { upsert: true }
      );
    } catch (e) {
      console.error(`[MongoAuth] Write error [${key}]:`, e.message);
    }
  };

  // Remove a key from DB
  const removeData = async (key) => {
    try {
      await WhatsAppAuth.deleteOne({ sessionId, key });
    } catch (e) {
      console.error(`[MongoAuth] Remove error [${key}]:`, e.message);
    }
  };

  // Load existing creds or create empty
  const { initAuthCreds, proto } = await import('@whiskeysockets/baileys');
  let creds = await readData('creds');
  if (!creds) {
    creds = initAuthCreds();
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const result = {};
          for (const id of ids) {
            const value = await readData(`${type}-${id}`);
            if (value) {
              // Handle pre-key and session deserialization per Baileys convention
              if (type === 'app-state-sync-key' && value) {
                result[id] = proto.Message.AppStateSyncKeyData.fromObject(value);
              } else {
                result[id] = value;
              }
            }
          }
          return result;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                tasks.push(writeData(key, value));
              } else {
                tasks.push(removeData(key));
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: async () => {
      await writeData('creds', creds);
    },
  };
}

/**
 * Remove all auth data for a session from MongoDB.
 * @param {string} sessionId
 */
async function clearMongoDBAuthState(sessionId) {
  try {
    const result = await WhatsAppAuth.deleteMany({ sessionId });
    console.log(`[MongoAuth] Cleared ${result.deletedCount} keys for session ${sessionId}`);
  } catch (e) {
    console.error(`[MongoAuth] Clear error for ${sessionId}:`, e.message);
  }
}

/**
 * Check if a session has stored auth in MongoDB.
 * @param {string} sessionId
 * @returns {boolean}
 */
async function hasMongoDBAuthState(sessionId) {
  try {
    const doc = await WhatsAppAuth.findOne({ sessionId, key: 'creds' }).lean();
    return !!doc;
  } catch (e) {
    return false;
  }
}

module.exports = { useMongoDBAuthState, clearMongoDBAuthState, hasMongoDBAuthState };
