const status = document.getElementById('status');
const gridContainer = document.getElementById('grid-container');
const lettersGrid = document.getElementById('letters-grid');
const connectionsSvg = document.getElementById('connections-svg');

let gridData = null;
let selectedLetters = [];
let allConnections = [];

const gridLayout = [
    ['S', 'O', 'P', 'Y'],
    ['K', 'X', 'D', 'Q'],
    ['H', 'A', 'R', 'W'],
    ['Z', 'C', 'U', 'T']
];

async function loadMainJson() {
    try {
        const response = await fetch('main.json');
        if (!response.ok) {
            throw new Error(`Failed to load main.json: ${response.status} ${response.statusText}`);
        }
        gridData = await response.json();
        createGrid();
    } catch (error) {
        showStatus('Error loading main.json: ' + error.message, 'error');
        console.error('JSON loading error:', error);
    }
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;
    status.style.display = 'block';
    
    setTimeout(() => {
        status.style.display = 'none';
    }, 3000);
}

function createGrid() {
    if (!gridData) return;

    lettersGrid.innerHTML = '';

    gridLayout.forEach((row, rowIndex) => {
        row.forEach((letter, colIndex) => {
            const letterElement = document.createElement('div');
            letterElement.className = 'letter';
            letterElement.textContent = letter;
            letterElement.dataset.letter = letter;
            letterElement.dataset.row = rowIndex;
            letterElement.dataset.col = colIndex;
            letterElement.style.gridRow = rowIndex + 1;
            letterElement.style.gridColumn = colIndex + 1;

            letterElement.addEventListener('click', () => handleLetterClick(letter));
            lettersGrid.appendChild(letterElement);
        });
    });

    requestAnimationFrame(() => {
        drawAllConnections();
    });
}

function drawAllConnections() {
    const drawnConnections = new Set();
    allConnections = [];
    
    connectionsSvg.innerHTML = '';
    const containerRect = gridContainer.getBoundingClientRect();
    connectionsSvg.setAttribute('width', gridContainer.offsetWidth);
    connectionsSvg.setAttribute('height', gridContainer.offsetHeight);
    
    console.log('Drawing connections...', gridData);
    
    Object.keys(gridData).forEach(letter => {
        const fromElement = document.querySelector(`[data-letter="${letter}"]`);
        if (!fromElement) return;
        
        gridData[letter].connections.forEach(connectedLetter => {
            const toElement = document.querySelector(`[data-letter="${connectedLetter}"]`);
            if (!toElement) return;
            
            const connectionId = [letter, connectedLetter].sort().join('-');
            
            if (!drawnConnections.has(connectionId)) {
                drawnConnections.add(connectionId);
                
                const fromRect = fromElement.getBoundingClientRect();
                const toRect = toElement.getBoundingClientRect();
                
                const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
                const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
                const toX = toRect.left + toRect.width / 2 - containerRect.left;
                const toY = toRect.top + toRect.height / 2 - containerRect.top;
                
                console.log(`Connection ${letter} -> ${connectedLetter}: (${fromX},${fromY}) to (${toX},${toY})`);
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', fromX);
                line.setAttribute('y1', fromY);
                line.setAttribute('x2', toX);
                line.setAttribute('y2', toY);
                line.classList.add('connection-line');
                line.dataset.from = letter;
                line.dataset.to = connectedLetter;
                connectionsSvg.appendChild(line);
                
                allConnections.push({
                    from: letter,
                    to: connectedLetter,
                    element: line
                });
            }
        });
    });
    
    console.log('Total connections drawn:', allConnections.length);
}

function handleLetterClick(letter) {
    const letterElement = document.querySelector(`[data-letter="${letter}"]`);

    if (selectedLetters.length === 0) {
        selectedLetters.push(letter);
        letterElement.classList.add('active');
    } else {
        const lastLetter = selectedLetters[selectedLetters.length - 1];

        if (letter === lastLetter) return;

        if (isValidConnection(lastLetter, letter)) {
            // continue path
            selectedLetters.push(letter);
            letterElement.classList.add('active');
            updateConnectionsDisplay();
        } else {
            // reset if invalid
            clearSelection();
            selectedLetters = [letter];
            letterElement.classList.add('active');
            updateConnectionsDisplay();
        }
    }
}


function isValidConnection(letter1, letter2) {
    if (!gridData[letter1] || !gridData[letter2]) return false;
    
    return gridData[letter1].connections.includes(letter2) || 
           gridData[letter2].connections.includes(letter1);
}

function updateConnectionsDisplay() {
    document.querySelectorAll('.connection-line').forEach(line => {
        line.classList.remove('active');
    });
    
    if (selectedLetters.length >= 2) {
        for (let i = 0; i < selectedLetters.length - 1; i++) {
            const from = selectedLetters[i];
            const to = selectedLetters[i + 1];
            
            const connection = allConnections.find(conn => 
                (conn.from === from && conn.to === to) || 
                (conn.from === to && conn.to === from)
            );
            
            if (connection) {
                connection.element.classList.add('active');
            }
        }
    }
}

function clearSelection() {
    selectedLetters = [];
    document.querySelectorAll('.letter').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll('.connection-line').forEach(line => {
        line.classList.remove('active');
    });
}

function handleResize() {
    if (gridData) {
        setTimeout(drawAllConnections, 100);
    }
}

function init() {
    loadMainJson();
    window.addEventListener('resize', handleResize);
}

const input = document.getElementById('sequence-input');
const checkBtn = document.getElementById('check-btn');

checkBtn.addEventListener('click', () => {
    const sequence = input.value.toUpperCase().split('');
    if (sequence.length === 0) return;

    let valid = true;
    for (let i = 0; i < sequence.length - 1; i++) {
        const from = sequence[i];
        const to = sequence[i + 1];
        if (!gridData[from] || !gridData[from].connections.includes(to)) {
            valid = false;
            break;
        }
    }

    if (valid) {
        checkBtn.classList.add("Valid");
    } else {
        checkBtn.classList.add("Invalid");
    }

    setTimeout(() => {
        checkBtn.classList.remove("Valid", "Invalid");
    }, 1000);
});



document.addEventListener('DOMContentLoaded', init);