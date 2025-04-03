FROM node:18-alpine

# Création du répertoire de l'application
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste des fichiers
COPY . .

# Exposition du port sur lequel l'application s'exécute
EXPOSE 3001

# Commande pour démarrer l'application
CMD ["node", "backend/local-server.js"]
