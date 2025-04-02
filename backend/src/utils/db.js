const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const R = require('ramda');

const adapter = new FileSync(path.join(__dirname, '../../data/db.json'));
const db = low(adapter);

// Initialize the database with default structure
const initializeDatabase = () => {
  const defaultDb = {
    users: [],
    meals: [],
    goals: []
  };
  
  db.defaults(defaultDb).write();
};

// Immutable database operations using Ramda
const getAll = (collection) => R.clone(db.get(collection).value());

const getById = (collection, id) => 
  R.pipe(
    R.clone,
    R.find(R.propEq('id', id))
  )(db.get(collection).value());

const getByUserId = (collection, userId) => 
  R.pipe(
    R.clone,
    R.filter(R.propEq('userId', userId))
  )(db.get(collection).value());

const insert = (collection, data) => {
  const newData = R.clone(data);
  db.get(collection).push(newData).write();
  return R.clone(newData);
};

const update = (collection, id, data) => {
  const updatedData = R.clone(data);
  db.get(collection).find({ id }).assign(updatedData).write();
  return R.clone(updatedData);
};

const remove = (collection, id) => {
  db.get(collection).remove({ id }).write();
};

module.exports = {
  initializeDatabase,
  getAll,
  getById,
  getByUserId,
  insert,
  update,
  remove,
  db // Expose the db for custom operations if needed
};
