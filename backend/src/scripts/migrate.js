require('dotenv').config();

const mongoose = require('mongoose');
const Board = require('../models/Board');
const User = require('../models/User');

async function migrateBoards() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const boards = await Board.find({});

  for (const board of boards) {
    if (!Array.isArray(board.members) || board.members.length === 0) continue;

    // Already migrated
    if (board.members[0].user) continue;

    const newMembers = board.members.map(userId => ({
      user: userId,
      role: userId.toString() === board.owner.toString() ? 'admin' : 'editor',
      joinedAt: board.createdAt || new Date()
    }));

    board.members = newMembers;
    board.invitations = board.invitations || [];
    await board.save();

    console.log(`Migrated board: ${board.name}`);
  }

  console.log('Migration complete!');
  process.exit(0);
}

migrateBoards().catch(err => {
  console.error(err);
  process.exit(1);
});
