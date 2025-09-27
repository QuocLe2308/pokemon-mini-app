let currentMode = 'battle';
let playerPokemon = null;
let opponentPokemon = null;
let quizPokemon = null;
let quizScore = 0;
let quizTotal = 0;
let typeChart = {};
let pokemonListData = [];
let filteredPokemonList = [];
let selectedPokemon = null;
let currentPage = 1;
let itemsPerPage = 100;
let totalPokemon = 0;
let allPokemonData = []; // Store all Pokémon data for filtering

// Type effectiveness matrix (simplified for reliability)
const typeEffectiveness = {
    'normal': { 'rock': 0.5, 'ghost': 0, 'steel': 0.5 },
    'fire': { 'fire': 0.5, 'water': 0.5, 'grass': 2, 'ice': 2, 'bug': 2, 'rock': 0.5, 'dragon': 0.5, 'steel': 2 },
    'water': { 'fire': 2, 'water': 0.5, 'grass': 0.5, 'ground': 2, 'rock': 2, 'dragon': 0.5 },
    'electric': { 'water': 2, 'electric': 0.5, 'grass': 0.5, 'ground': 0, 'flying': 2, 'dragon': 0.5 },
    'grass': { 'fire': 0.5, 'water': 2, 'grass': 0.5, 'poison': 0.5, 'ground': 2, 'flying': 0.5, 'bug': 0.5, 'rock': 2, 'dragon': 0.5, 'steel': 0.5 },
    'ice': { 'fire': 0.5, 'water': 0.5, 'grass': 2, 'ice': 0.5, 'ground': 2, 'flying': 2, 'dragon': 2, 'steel': 0.5 },
    'fighting': { 'normal': 2, 'ice': 2, 'poison': 0.5, 'flying': 0.5, 'psychic': 0.5, 'bug': 0.5, 'rock': 2, 'ghost': 0, 'dark': 2, 'steel': 2, 'fairy': 0.5 },
    'poison': { 'grass': 2, 'poison': 0.5, 'ground': 0.5, 'rock': 0.5, 'ghost': 0.5, 'steel': 0, 'fairy': 2 },
    'ground': { 'fire': 2, 'electric': 2, 'grass': 0.5, 'poison': 2, 'flying': 0, 'bug': 0.5, 'rock': 2, 'steel': 2 },
    'flying': { 'electric': 0.5, 'grass': 2, 'fighting': 2, 'bug': 2, 'rock': 0.5, 'steel': 0.5 },
    'psychic': { 'fighting': 2, 'poison': 2, 'psychic': 0.5, 'dark': 0, 'steel': 0.5 },
    'bug': { 'fire': 0.5, 'grass': 2, 'fighting': 0.5, 'poison': 0.5, 'flying': 0.5, 'psychic': 2, 'ghost': 0.5, 'dark': 2, 'steel': 0.5, 'fairy': 0.5 },
    'rock': { 'fire': 2, 'ice': 2, 'fighting': 0.5, 'ground': 0.5, 'flying': 2, 'bug': 2, 'steel': 0.5 },
    'ghost': { 'normal': 0, 'psychic': 2, 'ghost': 2, 'dark': 0.5 },
    'dragon': { 'dragon': 2, 'steel': 0.5, 'fairy': 0 },
    'dark': { 'fighting': 0.5, 'psychic': 2, 'ghost': 2, 'dark': 0.5, 'fairy': 0.5 },
    'steel': { 'fire': 0.5, 'water': 0.5, 'electric': 0.5, 'ice': 2, 'rock': 2, 'steel': 0.5, 'fairy': 2 },
    'fairy': { 'fire': 0.5, 'fighting': 2, 'poison': 0.5, 'dragon': 2, 'dark': 2, 'steel': 0.5 }
};

// ===== SHARED UTILITY FUNCTIONS =====
// These functions eliminate code duplication between Pokedex and Pokemon List

/**
 * Fetch Pokemon data from API
 * @param {string|number} searchTerm - Pokemon name or ID
 * @returns {Promise<Object>} Pokemon data
 */
async function fetchPokemonData(searchTerm) {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${searchTerm}`);
    if (!response.ok) throw new Error('Pokémon not found');
    return await response.json();
}

/**
 * Generate type badges HTML
 * @param {Array} types - Array of type objects or type names
 * @returns {string} HTML string for type badges
 */
function generateTypeBadges(types) {
    return types.map(t => {
        const typeName = typeof t === 'string' ? t : t.type.name;
        return `<span class="type-badge type-${typeName}">${typeName}</span>`;
    }).join('');
}

/**
 * Generate ability badges HTML
 * @param {Array} abilities - Array of ability objects
 * @returns {string} HTML string for ability badges
 */
function generateAbilityBadges(abilities) {
    return abilities.map(a => 
        `<span class="ability-badge">${a.ability.name.replace('-', ' ')}</span>`
    ).join('');
}

/**
 * Generate stats HTML with bars
 * @param {Array} stats - Array of stat objects
 * @param {boolean} showAll - Whether to show all stats or just main ones
 * @returns {string} HTML string for stats
 */
function generateStatsHTML(stats, showAll = false) {
    const mainStats = ['hp', 'attack', 'defense', 'speed'];
    const statsToShow = showAll ? stats : stats.filter(stat => mainStats.includes(stat.stat.name));
    
    return statsToShow.map(stat => {
        const statName = stat.stat.name.replace('-', ' ');
        const statValue = stat.base_stat;
        return `
            <div class="pokemon-stat">
                <span>${statName.charAt(0).toUpperCase() + statName.slice(1)}: ${statValue}</span>
                <div class="stat-bar"><div class="stat-fill" style="width: ${(statValue/255)*100}%"></div></div>
            </div>
        `;
    }).join('');
}

/**
 * Calculate total stats
 * @param {Array} stats - Array of stat objects
 * @returns {number} Total base stats
 */
function calculateTotalStats(stats) {
    return stats.reduce((sum, stat) => sum + stat.base_stat, 0);
}

/**
 * Get Pokemon sprite URL (prefers official artwork)
 * @param {Object} sprites - Pokemon sprites object
 * @returns {string} Sprite URL
 */
function getPokemonSprite(sprites) {
    return sprites.other['official-artwork'].front_default || sprites.front_default;
}

/**
 * Format Pokemon name (capitalize first letter)
 * @param {string} name - Pokemon name
 * @returns {string} Formatted name
 */
function formatPokemonName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Get Pokemon description from species data
 * @param {Object} speciesData - Species data from API
 * @returns {string} Description text
 */
function getPokemonDescription(speciesData) {
    const description = speciesData.flavor_text_entries.find(entry => 
        entry.language.name === 'en'
    )?.flavor_text || 'No description available.';
    return description.replace(/\f/g, ' ');
}

/**
 * Create simplified Pokemon data object for list display
 * @param {Object} pokemon - Full Pokemon data from API
 * @returns {Object} Simplified Pokemon data
 */
function createPokemonDataObject(pokemon) {
    return {
        id: pokemon.id,
        name: pokemon.name,
        types: pokemon.types.map(t => t.type.name),
        sprite: getPokemonSprite(pokemon.sprites),
        stats: {
            hp: pokemon.stats.find(s => s.stat.name === 'hp').base_stat,
            attack: pokemon.stats.find(s => s.stat.name === 'attack').base_stat,
            defense: pokemon.stats.find(s => s.stat.name === 'defense').base_stat,
            speed: pokemon.stats.find(s => s.stat.name === 'speed').base_stat,
            total: calculateTotalStats(pokemon.stats)
        }
    };
}

/**
 * Smart navigation between modes with Pokemon context
 * @param {string} targetMode - Target mode to switch to
 * @param {string|number} pokemonId - Pokemon ID to search for in target mode
 * @param {string} action - Action to perform ('view', 'battle', 'search')
 */
async function smartNavigate(targetMode, pokemonId = null, action = 'view') {
    // Switch to target mode first
    switchMode(targetMode);
    
    if (pokemonId) {
        // Set search input value
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = pokemonId;
        }
        
        // Perform appropriate action based on mode and action
        switch (targetMode) {
            case 'pokedex':
                await searchPokemonForPokedex(pokemonId);
                break;
            case 'battle':
                if (action === 'battle') {
                    await searchPokemonForBattle(pokemonId);
                }
                break;
            case 'list':
                // For list mode, just scroll to the pokemon if it exists
                const pokemonItem = document.querySelector(`[data-pokemon-id="${pokemonId}"]`);
                if (pokemonItem) {
                    pokemonItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    selectPokemonFromList(pokemonId);
                }
                break;
        }
    }
}

function switchMode(mode) {
    currentMode = mode;
    
    // Update buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Hide all modes
    document.querySelectorAll('.mode-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show selected mode
    document.getElementById(`${mode}Mode`).classList.remove('hidden');
    
    // Update search placeholder
    const searchInput = document.getElementById('searchInput');
    if (mode === 'battle') {
        searchInput.placeholder = "Search your fighter (name or ID)";
        document.getElementById('searchBtn').textContent = "Choose Fighter";
        document.getElementById('randomBtn').textContent = "Get Random Opponent";
    } else if (mode === 'pokedex') {
        searchInput.placeholder = "Search Pokémon for details";
        document.getElementById('searchBtn').textContent = "Search Pokédex";
        document.getElementById('randomBtn').textContent = "Random Pokémon";
    } else if (mode === 'list') {
        searchInput.style.display = 'none';
        document.getElementById('searchBtn').style.display = 'none';
        document.getElementById('randomBtn').style.display = 'none';
        
        // Auto-load Pokémon list when switching to list mode
        if (pokemonListData.length === 0) {
            loadPokemonList();
        }
    } else if (mode === 'quiz') {
        searchInput.style.display = 'none';
        document.getElementById('searchBtn').style.display = 'none';
        document.getElementById('randomBtn').style.display = 'none';
    }
    
    if (mode !== 'quiz' && mode !== 'list') {
        document.getElementById('searchInput').style.display = 'block';
        document.getElementById('searchBtn').style.display = 'block';
        document.getElementById('randomBtn').style.display = 'block';
    }
}

async function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    if (!searchTerm) {
        showError('Please enter a Pokémon name or ID');
        return;
    }

    if (currentMode === 'battle') {
        await searchPokemonForBattle(searchTerm);
    } else if (currentMode === 'pokedex') {
        await searchPokemonForPokedex(searchTerm);
    }
}

async function searchPokemonForBattle(searchTerm) {
    showError('');
    document.getElementById('battleArena').classList.add('hidden');
    document.getElementById('battleResult').style.display = 'none';
    
    try {
        const data = await fetchPokemonData(searchTerm);
        playerPokemon = data;
        
        displayPokemonCard(data, 'playerCard', 'Your Fighter');
        document.getElementById('battleArena').classList.remove('hidden');
        
        // Auto-load random opponent
        await getRandomOpponent();
        
    } catch (error) {
        showError('Pokémon not found. Try another name or ID (1-1025)');
    }
}

async function searchPokemonForPokedex(searchTerm) {
    showError('');
    const pokedexView = document.getElementById('pokedexView');
    pokedexView.innerHTML = '<div class="loading">Loading Pokémon data...</div>';
    pokedexView.classList.remove('hidden');
    
    try {
        const data = await fetchPokemonData(searchTerm);
        
        // Fetch species data for additional info
        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();
        
        displayPokedexEntry(data, speciesData);
        
    } catch (error) {
        showError('Pokémon not found. Try another name or ID (1-1025)');
        pokedexView.classList.add('hidden');
    }
}

async function getRandomPokemon() {
    if (currentMode === 'battle') {
        await getRandomOpponent();
    } else if (currentMode === 'pokedex') {
        const randomId = Math.floor(Math.random() * 1025) + 1;
        await searchPokemonForPokedex(randomId);
    }
}

async function getRandomOpponent() {
    if (!playerPokemon && currentMode === 'battle') {
        showError('Please choose your Pokémon first!');
        return;
    }
    
    const randomId = Math.floor(Math.random() * 1025) + 1;
    
    try {
        const data = await fetchPokemonData(randomId);
        
        opponentPokemon = data;
        displayPokemonCard(data, 'opponentCard', 'Opponent');
        document.getElementById('battleBtn').style.display = 'block';
        document.getElementById('battleResult').style.display = 'none';
        
        // Remove winner class from previous battles
        document.getElementById('playerCard').classList.remove('winner');
        document.getElementById('opponentCard').classList.remove('winner');
        
    } catch (error) {
        showError('Error loading opponent. Please try again.');
    }
}

function displayPokemonCard(pokemon, cardId, label) {
    const card = document.getElementById(cardId);
    const types = generateTypeBadges(pokemon.types);
    const stats = generateStatsHTML(pokemon.stats, false);
    const totalStats = calculateTotalStats(pokemon.stats);
    const sprite = getPokemonSprite(pokemon.sprites);
    const name = formatPokemonName(pokemon.name);
    
    card.innerHTML = `
        <h2>${label}: ${name} #${pokemon.id}</h2>
        <img src="${sprite}" alt="${name}" class="pokemon-sprite">
        <div class="pokemon-info">
            <div style="text-align: center; margin: 10px 0;">${types}</div>
            ${stats}
            <div class="pokemon-stat" style="background: linear-gradient(90deg, #667eea, #764ba2); color: white;">
                <span>Total Power: ${totalStats}</span>
            </div>
        </div>
    `;
}

function displayPokedexEntry(pokemon, speciesData) {
    const pokedexView = document.getElementById('pokedexView');
    const types = generateTypeBadges(pokemon.types);
    const abilities = generateAbilityBadges(pokemon.abilities);
    const stats = generateStatsHTML(pokemon.stats, true);
    const totalStats = calculateTotalStats(pokemon.stats);
    const sprite = getPokemonSprite(pokemon.sprites);
    const name = formatPokemonName(pokemon.name);
    const description = getPokemonDescription(speciesData);
    
    pokedexView.innerHTML = `
        <div class="pokemon-detail">
            <div class="pokemon-image-section">
                <h2>${name} #${pokemon.id}</h2>
                <img src="${sprite}" alt="${name}" class="pokemon-main-sprite">
                <div class="sprite-variations">
                    <img src="${pokemon.sprites.front_default}" class="sprite-thumb" 
                         onclick="changeMainSprite('${pokemon.sprites.front_default}')" title="Front">
                    <img src="${pokemon.sprites.back_default}" class="sprite-thumb" 
                         onclick="changeMainSprite('${pokemon.sprites.back_default}')" title="Back">
                    <img src="${pokemon.sprites.front_shiny}" class="sprite-thumb" 
                         onclick="changeMainSprite('${pokemon.sprites.front_shiny}')" title="Shiny Front">
                    <img src="${pokemon.sprites.back_shiny}" class="sprite-thumb" 
                         onclick="changeMainSprite('${pokemon.sprites.back_shiny}')" title="Shiny Back">
                </div>
            </div>
            
            <div class="pokemon-details-section">
                <h3>Types</h3>
                <div>${types}</div>
                
                <h3>Abilities</h3>
                <div class="abilities-list">${abilities}</div>
                
                <h3>Description</h3>
                <p>${description}</p>
                
                <h3>Base Stats</h3>
                ${stats}
                
                <div class="pokemon-stat" style="background: linear-gradient(90deg, #667eea, #764ba2); color: white;">
                    <span>Total Base Stats: ${totalStats}</span>
                </div>
                
                <h3>Physical Characteristics</h3>
                <div class="pokemon-stat">
                    <span>Height: ${(pokemon.height / 10).toFixed(1)}m</span>
                </div>
                <div class="pokemon-stat">
                    <span>Weight: ${(pokemon.weight / 10).toFixed(1)}kg</span>
                </div>
            </div>
        </div>
    `;
}

function changeMainSprite(spriteUrl) {
    const mainSprite = document.querySelector('.pokemon-main-sprite');
    mainSprite.src = spriteUrl;
}

function simulateBattle() {
    if (!playerPokemon || !opponentPokemon) {
        showError('Both Pokémon must be selected for battle!');
        return;
    }
    
    const playerTotal = calculateTotalStats(playerPokemon.stats);
    const opponentTotal = calculateTotalStats(opponentPokemon.stats);
    
    // Calculate type effectiveness
    const playerTypes = playerPokemon.types.map(t => t.type.name);
    const opponentTypes = opponentPokemon.types.map(t => t.type.name);
    
    let playerMultiplier = 1;
    let opponentMultiplier = 1;
    
    // Calculate effectiveness for each type matchup
    playerTypes.forEach(playerType => {
        opponentTypes.forEach(opponentType => {
            const effectiveness = typeEffectiveness[playerType]?.[opponentType] || 1;
            playerMultiplier *= effectiveness;
        });
    });
    
    opponentTypes.forEach(opponentType => {
        playerTypes.forEach(playerType => {
            const effectiveness = typeEffectiveness[opponentType]?.[playerType] || 1;
            opponentMultiplier *= effectiveness;
        });
    });
    
    // Apply type effectiveness to total stats
    const playerFinalPower = playerTotal * playerMultiplier;
    const opponentFinalPower = opponentTotal * opponentMultiplier;
    
    const winner = playerFinalPower > opponentFinalPower ? 'player' : 'opponent';
    const winnerPokemon = winner === 'player' ? playerPokemon : opponentPokemon;
    const loserPokemon = winner === 'player' ? opponentPokemon : playerPokemon;
    
    // Display results
    const battleResult = document.getElementById('battleResult');
    battleResult.innerHTML = `
        <div class="result-section">
            <h3>🏆 ${winnerPokemon.name.charAt(0).toUpperCase() + winnerPokemon.name.slice(1)} Wins! 🏆</h3>
            <div class="damage-multiplier">
                <strong>Battle Analysis:</strong><br>
                ${playerPokemon.name}: ${playerTotal} base stats × ${playerMultiplier.toFixed(2)} type effectiveness = ${playerFinalPower.toFixed(0)}<br>
                ${opponentPokemon.name}: ${opponentTotal} base stats × ${opponentMultiplier.toFixed(2)} type effectiveness = ${opponentFinalPower.toFixed(0)}
            </div>
            <button onclick="resetBattle()" style="margin-top: 15px;">Battle Again!</button>
        </div>
    `;
    
    battleResult.style.display = 'block';
    
    // Add winner animation
    const winnerCard = document.getElementById(winner === 'player' ? 'playerCard' : 'opponentCard');
    winnerCard.classList.add('winner');
    
    // Hide battle button
    document.getElementById('battleBtn').style.display = 'none';
}

function resetBattle() {
    document.getElementById('battleResult').style.display = 'none';
    document.getElementById('playerCard').classList.remove('winner');
    document.getElementById('opponentCard').classList.remove('winner');
    document.getElementById('battleBtn').style.display = 'block';
}

// Quiz Mode Functions
async function startNewQuiz() {
    quizScore = 0;
    quizTotal = 0;
    updateQuizScore();
    await generateQuizQuestion();
}

async function generateQuizQuestion() {
    const randomId = Math.floor(Math.random() * 1025) + 1;
    
    try {
        const data = await fetchPokemonData(randomId);
        
        quizPokemon = data;
        const correctType = data.types[0].type.name;
        const sprite = getPokemonSprite(data.sprites);
        const name = formatPokemonName(data.name);
        
        // Generate wrong options
        const allTypes = Object.keys(typeEffectiveness);
        const wrongTypes = allTypes.filter(type => type !== correctType);
        const shuffledWrong = wrongTypes.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        const options = [correctType, ...shuffledWrong].sort(() => 0.5 - Math.random());
        
        const quizContent = document.getElementById('quizContent');
        quizContent.innerHTML = `
            <div class="quiz-question">
                <h3>What type is this Pokémon?</h3>
                <img src="${sprite}" alt="${name}" class="quiz-pokemon-sprite" id="quizSprite">
                <p style="margin-top: 10px; font-size: 1.2em; font-weight: bold;">${name}</p>
            </div>
            <div class="quiz-options">
                ${options.map(type => `
                    <div class="quiz-option" onclick="checkQuizAnswer('${type}', '${correctType}')">
                        ${formatPokemonName(type)}
                    </div>
                `).join('')}
            </div>
        `;
        
        // Reveal sprite after a short delay
        setTimeout(() => {
            document.getElementById('quizSprite').classList.add('revealed');
        }, 500);
        
    } catch (error) {
        showError('Error loading quiz Pokémon. Please try again.');
    }
}

function checkQuizAnswer(selectedType, correctType) {
    quizTotal++;
    const isCorrect = selectedType === correctType;
    
    if (isCorrect) {
        quizScore++;
    }
    
    // Update score display
    updateQuizScore();
    
    // Show result
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(option => {
        option.style.pointerEvents = 'none';
        if (option.textContent.toLowerCase().trim() === correctType) {
            option.classList.add('correct');
        } else if (option.textContent.toLowerCase().trim() === selectedType && !isCorrect) {
            option.classList.add('incorrect');
        }
    });
    
    // Show next question button after delay
    setTimeout(() => {
        const quizContent = document.getElementById('quizContent');
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next Question';
        nextButton.onclick = generateQuizQuestion;
        nextButton.style.display = 'block';
        nextButton.style.margin = '20px auto';
        quizContent.appendChild(nextButton);
    }, 2000);
}

function updateQuizScore() {
    document.getElementById('quizScore').textContent = quizScore;
    document.getElementById('quizTotal').textContent = quizTotal;
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.className = message ? 'error' : '';
}

// List Mode Functions
async function loadPokemonList() {
    const pokemonList = document.getElementById('pokemonList');
    const loadBtn = document.getElementById('loadListBtn');
    
    // Reset everything
    pokemonListData = [];
    filteredPokemonList = [];
    allPokemonData = [];
    currentPage = 1;
    
    console.log('🚀 Starting to load ALL Pokémon...');
    
    pokemonList.innerHTML = '<div class="loading">Loading ALL Pokémon... This may take a moment.</div>';
    loadBtn.disabled = true;
    loadBtn.textContent = 'Loading ALL Pokémon...';
    
    try {
        // First, get total count from API
        await getTotalPokemonCount();
        
        // Then load ALL Pokémon at once
        await loadAllPokemon();
        
    } catch (error) {
        console.error('❌ Error loading Pokémon:', error);
        pokemonList.innerHTML = '<div class="error">Error loading Pokémon data. Please try again.</div>';
        loadBtn.disabled = false;
        loadBtn.textContent = 'Load Pokémon List';
    }
}

async function getTotalPokemonCount() {
    console.log('📊 Getting total Pokémon count...');
    
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1');
    const data = await response.json();
    totalPokemon = data.count;
    
    console.log(`📈 API reports ${totalPokemon} Pokémon available`);
    
    // Update UI
    document.getElementById('pokemonCount').textContent = `Ready to load Pokémon (API reports ${totalPokemon})!`;
}

async function loadAllPokemon() {
    console.log('📦 Loading ALL Pokémon in batches...');
    
    let actualTotalPokemon = 0;
    let lastSuccessfulId = 0;
    let totalErrors = 0;
    
    // Load in batches of 100 to avoid overwhelming the API
    for (let batch = 0; batch < Math.ceil(totalPokemon / itemsPerPage); batch++) {
        const startId = batch * itemsPerPage + 1;
        const endId = Math.min((batch + 1) * itemsPerPage, totalPokemon);
        
        console.log(`📥 Loading batch ${batch + 1}/${Math.ceil(totalPokemon / itemsPerPage)}: Pokémon ${startId} to ${endId}`);
        
        // Update loading message
        document.getElementById('pokemonList').innerHTML = `<div class="loading">Loading batch ${batch + 1}/${Math.ceil(totalPokemon / itemsPerPage)}: Pokémon ${startId} to ${endId}</div>`;
        
        const promises = [];
        for (let i = startId; i <= endId; i++) {
            promises.push(fetch(`https://pokeapi.co/api/v2/pokemon/${i}`));
        }
        
        const responses = await Promise.all(promises);
        
        // Process each response individually
        const batchPokemonData = [];
        let batchErrors = 0;
        
        for (let i = 0; i < responses.length; i++) {
            const response = responses[i];
            const pokemonId = startId + i;
            
            if (response.ok) {
                try {
                    const pokemon = await response.json();
                    batchPokemonData.push(pokemon);
                    lastSuccessfulId = pokemonId;
                } catch (error) {
                    console.log(`⚠️ Failed to parse JSON for Pokémon ${pokemonId}`);
                    batchErrors++;
                    totalErrors++;
                }
            } else {
                console.log(`⚠️ Pokémon ${pokemonId} not found (${response.status})`);
                batchErrors++;
                totalErrors++;
            }
        }
        
        if (batchErrors > 0) {
            console.log(`⚠️ Batch ${batch + 1} had ${batchErrors} errors, but continuing...`);
        }
        
        // Process successful Pokémon data
        const newPokemonData = batchPokemonData.map(pokemon => createPokemonDataObject(pokemon));
        
        // Add new data to existing list
        pokemonListData = [...pokemonListData, ...newPokemonData];
        filteredPokemonList = [...pokemonListData];
        actualTotalPokemon = pokemonListData.length;
        
        console.log(`✅ Loaded ${pokemonListData.length} Pokémon so far (up to ID ${lastSuccessfulId})`);
        
        // Small delay between batches to be nice to the API
        if (batch < Math.ceil(totalPokemon / itemsPerPage) - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    // Update totalPokemon to actual loaded count
    totalPokemon = actualTotalPokemon;
    
    console.log(`🎉 Loaded ${actualTotalPokemon} Pokémon successfully! (Last ID: ${lastSuccessfulId}, Total errors: ${totalErrors})`);
    
    displayPokemonList();
    updatePokemonCount();
    updatePaginationControls();
    
    document.getElementById('loadListBtn').disabled = false;
    document.getElementById('loadListBtn').textContent = `All ${actualTotalPokemon} Pokémon Loaded!`;
}

function displayPokemonList() {
    const pokemonList = document.getElementById('pokemonList');
    
    if (filteredPokemonList.length === 0) {
        pokemonList.innerHTML = '<div class="loading">No Pokémon found matching your filters.</div>';
        return;
    }
    
    pokemonList.innerHTML = filteredPokemonList.map(pokemon => {
        const name = formatPokemonName(pokemon.name);
        const types = generateTypeBadges(pokemon.types);
        
        return `
        <div class="pokemon-list-item" onclick="selectPokemonFromList(${pokemon.id})" data-pokemon-id="${pokemon.id}">
            <div class="pokemon-list-header">
                <img src="${pokemon.sprite}" alt="${name}" class="pokemon-list-sprite">
                <div class="pokemon-list-info">
                    <h3>${name}</h3>
                    <span class="pokemon-id">#${pokemon.id.toString().padStart(3, '0')}</span>
                </div>
            </div>
            
            <div class="pokemon-list-types">
                ${types}
            </div>
            
            <div class="pokemon-list-stats">
                <div class="pokemon-list-stat">
                    <span>HP:</span>
                    <span>${pokemon.stats.hp}</span>
                </div>
                <div class="pokemon-list-stat">
                    <span>ATK:</span>
                    <span>${pokemon.stats.attack}</span>
                </div>
                <div class="pokemon-list-stat">
                    <span>DEF:</span>
                    <span>${pokemon.stats.defense}</span>
                </div>
                <div class="pokemon-list-stat">
                    <span>SPD:</span>
                    <span>${pokemon.stats.speed}</span>
                </div>
            </div>
            
            <div class="pokemon-list-total">
                Total: ${pokemon.stats.total}
            </div>
        </div>
    `;
    }).join('');
}

function selectPokemonFromList(pokemonId) {
    // Remove previous selection
    document.querySelectorAll('.pokemon-list-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    const selectedItem = document.querySelector(`[data-pokemon-id="${pokemonId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
    
    selectedPokemon = pokemonId;
    
    // Show action buttons
    showPokemonActions(pokemonId);
}

function showPokemonActions(pokemonId) {
    // Remove existing action buttons
    const existingActions = document.getElementById('pokemonActions');
    const existingBackdrop = document.getElementById('pokemonActionsBackdrop');
    if (existingActions) {
        existingActions.remove();
    }
    if (existingBackdrop) {
        existingBackdrop.remove();
    }
    
    // Create backdrop first to prevent layout shift
    const backdrop = document.createElement('div');
    backdrop.id = 'pokemonActionsBackdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        opacity: 0;
        transition: opacity 0.2s ease;
    `;
    backdrop.onclick = closePokemonActions;
    document.body.appendChild(backdrop);
    
    // Force reflow to ensure backdrop is rendered
    backdrop.offsetHeight;
    
    // Create floating action buttons with initial hidden state
    const actionsDiv = document.createElement('div');
    actionsDiv.id = 'pokemonActions';
    actionsDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.8);
        z-index: 1000;
        display: flex;
        gap: 15px;
        padding: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 15px;
        color: white;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        opacity: 0;
        transition: all 0.2s ease;
    `;
    
    actionsDiv.innerHTML = `
        <button onclick="viewPokemonDetails(${pokemonId})" style="background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: bold; transition: all 0.3s ease;">
            📖 View Details
        </button>
        <button onclick="usePokemonInBattle(${pokemonId})" style="background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-weight: bold; transition: all 0.3s ease;">
            ⚔️ Use in Battle
        </button>
        <button onclick="closePokemonActions()" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 12px 16px; border-radius: 25px; cursor: pointer; font-weight: bold; transition: all 0.3s ease;">
            ✕ Close
        </button>
    `;
    
    // Add hover effects to buttons
    const buttons = actionsDiv.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });
    
    document.body.appendChild(actionsDiv);
    
    // Force reflow to ensure modal is rendered
    actionsDiv.offsetHeight;
    
    // Animate in smoothly
    requestAnimationFrame(() => {
        backdrop.style.opacity = '1';
        actionsDiv.style.opacity = '1';
        actionsDiv.style.transform = 'translate(-50%, -50%) scale(1)';
    });
}

function closePokemonActions() {
    const actionsDiv = document.getElementById('pokemonActions');
    const backdrop = document.getElementById('pokemonActionsBackdrop');
    
    if (actionsDiv) {
        // Animate out smoothly
        actionsDiv.style.opacity = '0';
        actionsDiv.style.transform = 'translate(-50%, -50%) scale(0.8)';
        
        // Remove after animation completes
        setTimeout(() => {
            if (actionsDiv.parentNode) {
                actionsDiv.remove();
            }
        }, 200);
    }
    
    if (backdrop) {
        // Animate backdrop out
        backdrop.style.opacity = '0';
        
        // Remove after animation completes
        setTimeout(() => {
            if (backdrop.parentNode) {
                backdrop.remove();
            }
        }, 200);
    }
    
    // Remove selection from Pokemon list items
    document.querySelectorAll('.pokemon-list-item').forEach(item => {
        item.classList.remove('selected');
    });
}

async function viewPokemonDetails(pokemonId) {
    // Close the action modal first
    closePokemonActions();
    
    // Use smart navigation to switch to pokedex mode and view details
    await smartNavigate('pokedex', pokemonId, 'view');
}

async function usePokemonInBattle(pokemonId) {
    // Close the action modal first
    closePokemonActions();
    
    // Use smart navigation to switch to battle mode and set as player pokemon
    await smartNavigate('battle', pokemonId, 'battle');
}

function filterPokemonList() {
    const typeFilter = document.getElementById('typeFilter').value;
    const generationFilter = document.getElementById('generationFilter').value;
    const searchTerm = document.getElementById('listSearchInput').value.toLowerCase().trim();
    
    filteredPokemonList = pokemonListData.filter(pokemon => {
        // Type filter
        if (typeFilter && !pokemon.types.includes(typeFilter)) {
            return false;
        }
        
        // Generation filter
        if (generationFilter) {
            const gen = parseInt(generationFilter);
            const ranges = {
                1: [1, 151],
                2: [152, 251],
                3: [252, 386],
                4: [387, 493],
                5: [494, 649],
                6: [650, 721],
                7: [722, 809],
                8: [810, 905],
                9: [906, 1025]
            };
            
            const [min, max] = ranges[gen];
            if (pokemon.id < min || pokemon.id > max) {
                return false;
            }
        }
        
        // Search filter
        if (searchTerm && !pokemon.name.includes(searchTerm) && !pokemon.id.toString().includes(searchTerm)) {
            return false;
        }
        
        return true;
    });
    
    displayPokemonList();
    updatePokemonCount();
}

function sortPokemonList() {
    const sortBy = document.getElementById('sortBy').value;
    
    filteredPokemonList.sort((a, b) => {
        switch (sortBy) {
            case 'id':
                return a.id - b.id;
            case 'name':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'total-stats':
                return b.stats.total - a.stats.total;
            case 'hp':
                return b.stats.hp - a.stats.hp;
            case 'attack':
                return b.stats.attack - a.stats.attack;
            case 'defense':
                return b.stats.defense - a.stats.defense;
            case 'speed':
                return b.stats.speed - a.stats.speed;
            default:
                return a.id - b.id;
        }
    });
    
    displayPokemonList();
}

function updatePokemonCount() {
    const pokemonCount = document.getElementById('pokemonCount');
    pokemonCount.textContent = `Showing ${filteredPokemonList.length} of ${pokemonListData.length} Pokémon loaded`;
}

function updatePaginationControls() {
    const pokemonList = document.getElementById('pokemonList');
    
    // Remove existing pagination
    const existingPagination = document.getElementById('paginationControls');
    if (existingPagination) {
        existingPagination.remove();
    }
    
    // Only show pagination if we have data
    if (pokemonListData.length === 0) return;
    
    // Add simple info display
    const paginationDiv = document.createElement('div');
    paginationDiv.id = 'paginationControls';
    paginationDiv.style.cssText = `
        grid-column: 1 / -1;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 10px;
    `;
    
    paginationDiv.innerHTML = `
        <span style="font-weight: bold; color: #667eea;">
            Showing ${filteredPokemonList.length} of ${pokemonListData.length} Pokémon loaded
        </span>
    `;
    
    pokemonList.appendChild(paginationDiv);
}

function resetPokemonList() {
    currentPage = 1;
    pokemonListData = [];
    filteredPokemonList = [];
    document.getElementById('loadListBtn').textContent = 'Load All Pokémon (1025)';
    document.getElementById('pokemonCount').textContent = 'Ready to load all 1025 Pokémon!';
    document.getElementById('pokemonList').innerHTML = '<div class="loading">Click "Load All Pokémon (1025)" to start exploring all Pokémon!</div>';
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set initial mode
    switchMode('battle');
    
    // Add enter key support for search
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Debug: Check if functions are loaded
    console.log('Pokémon Battle Arena loaded successfully!');
    console.log('loadPokemonList function available:', typeof loadPokemonList);
});
