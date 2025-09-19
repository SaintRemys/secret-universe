<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Letter Grid Visualizer</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f0f0f0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        #canvas {
            border: 2px solid #333;
            border-radius: 10px;
            display: block;
            margin: 20px auto;
            background: white;
        }
        .controls {
            text-align: center;
            margin: 20px 0;
        }
        button {
            padding: 10px 20px;
            margin: 0 5px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #0056b3;
        }
        .file-input {
            margin: 10px;
            padding: 10px;
            background: #28a745;
        }
        .file-input:hover {
            background: #1e7e34;
        }
        .status {
            text-align: center;
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
        }
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 style="text-align: center;">Letter Grid Visualizer</h1>
        
        <div class="controls">
            <input type="file" id="fileInput" accept=".json" style="display: none;">
            <button class="file-input" onclick="document.getElementById('fileInput').click()">
                Load JSON File
            </button>
            <button onclick="toggleConnections()">Toggle Connections</button>
            <button onclick="clearCanvas()">Clear Canvas</button>
        </div>
        
        <div id="status" class="status" style="display: none;"></div>
        
        <canvas id="canvas" width="600" height="600"></canvas>
        
        <div style="text-align: center; margin-top: 20px;">
            <p><strong>Instructions:</strong></p>
            <p>1. Click "Load JSON File" and select your main.json file</p>
            <p>2. The grid will automatically draw with letters and connections</p>
            <p>3. Use "Toggle Connections" to show/hide connection lines</p>
            <p>4. Hover over letters to highlight their connections</p>
        </div>
    </div>

    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const fileInput = document.getElementById('fileInput');
        const status = document.getElementById('status');
        
        let gridData = null;
        let showConnections = true;
        let hoveredLetter = null;
        
        // Grid layout - 4x4 grid
        const gridLayout = [
            ['S', 'O', 'P', 'Y'],
            ['K', 'X', 'D', 'Q'],
            ['H', 'A', 'R', 'W'],
            ['Z', 'C', 'U', 'T']
        ];
        
        // Calculate positions for each letter
        const letterPositions = {};
        const gridSize = 4;
        const cellSize = 120;
        const offsetX = 60;
        const offsetY = 60;
        
        // Initialize letter positions
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const letter = gridLayout[row][col];
                letterPositions[letter] = {
                    x: offsetX + col * cellSize + cellSize / 2,
                    y: offsetY + row * cellSize + cellSize / 2
                };
            }
        }
        
        // Load JSON file
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        gridData = JSON.parse(e.target.result);
                        showStatus('JSON file loaded successfully!', 'success');
                        drawGrid();
                    } catch (error) {
                        showStatus('Error parsing JSON file: ' + error.message, 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
        
        // Show status message
        function showStatus(message, type) {
            status.textContent = message;
            status.className = 'status ' + type;
            status.style.display = 'block';
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
        
        // Draw the complete grid
        function drawGrid() {
            if (!gridData) {
                // Use sample data if no file loaded
                gridData = {
                    "S": { "connections": ["O", "K"] },
                    "O": { "connections": ["S", "K", "X", "D", "P"] },
                    "P": { "connections": ["O", "X", "D", "Y"] },
                    "Y": { "connections": ["P", "Q"] },
                    "K": { "connections": ["S", "O"] },
                    "X": { "connections": ["O", "P", "D", "R"] },
                    "D": { "connections": ["X", "O", "P", "Q"] },
                    "Q": { "connections": ["D", "Y", "R"] },
                    "H": { "connections": ["Z"] },
                    "A": { "connections": ["Z", "C", "U"] },
                    "R": { "connections": ["X", "Q", "C", "T"] },
                    "W": { "connections": ["U", "T"] },
                    "Z": { "connections": ["H", "A", "C"] },
                    "C": { "connections": ["Z", "A", "R", "U"] },
                    "U": { "connections": ["C", "A", "W", "T"] },
                    "T": { "connections": ["U", "R", "W"] }
                };
            }
            
            clearCanvas();
            
            // Draw connections first (so they appear behind letters)
            if (showConnections) {
                drawConnections();
            }
            
            // Draw letters
            drawLetters();
        }
        
        // Draw all connections
        function drawConnections() {
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Dashed lines
            
            Object.keys(gridData).forEach(letter => {
                const fromPos = letterPositions[letter];
                if (!fromPos) return;
                
                gridData[letter].connections.forEach(connectedLetter => {
                    const toPos = letterPositions[connectedLetter];
                    if (!toPos) return;
                    
                    // Only draw each connection once (avoid duplicates)
                    if (letter < connectedLetter) {
                        ctx.beginPath();
                        ctx.moveTo(fromPos.x, fromPos.y);
                        ctx.lineTo(toPos.x, toPos.y);
                        ctx.stroke();
                    }
                });
            });
            
            ctx.setLineDash([]); // Reset line dash
        }
        
        // Draw highlighted connections for hovered letter
        function drawHighlightedConnections(letter) {
            if (!gridData[letter]) return;
            
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 3;
            
            const fromPos = letterPositions[letter];
            if (!fromPos) return;
            
            gridData[letter].connections.forEach(connectedLetter => {
                const toPos = letterPositions[connectedLetter];
                if (!toPos) return;
                
                ctx.beginPath();
                ctx.moveTo(fromPos.x, fromPos.y);
                ctx.lineTo(toPos.x, toPos.y);
                ctx.stroke();
            });
        }
        
        // Draw all letters
        function drawLetters() {
            Object.keys(letterPositions).forEach(letter => {
                drawLetter(letter, letterPositions[letter]);
            });
        }
        
        // Draw individual letter
        function drawLetter(letter, position) {
            const radius = 25;
            const isHovered = letter === hoveredLetter;
            
            // Draw circle
            ctx.beginPath();
            ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = isHovered ? '#ffeb3b' : '#4CAF50';
            ctx.fill();
            ctx.strokeStyle = isHovered ? '#f57c00' : '#388E3C';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Draw letter text
            ctx.fillStyle = 'white';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(letter, position.x, position.y);
        }
        
        // Clear canvas
        function clearCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // Toggle connections visibility
        function toggleConnections() {
            showConnections = !showConnections;
            drawGrid();
        }
        
        // Get letter at mouse position
        function getLetterAtPosition(mouseX, mouseY) {
            for (const letter in letterPositions) {
                const pos = letterPositions[letter];
                const distance = Math.sqrt((mouseX - pos.x) ** 2 + (mouseY - pos.y) ** 2);
                if (distance <= 25) {
                    return letter;
                }
            }
            return null;
        }
        
        // Mouse move event for hover effects
        canvas.addEventListener('mousemove', function(event) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;
            
            const letter = getLetterAtPosition(mouseX, mouseY);
            
            if (letter !== hoveredLetter) {
                hoveredLetter = letter;
                drawGrid();
                
                if (hoveredLetter && showConnections) {
                    drawHighlightedConnections(hoveredLetter);
                }
            }
            
            canvas.style.cursor = letter ? 'pointer' : 'default';
        });
        
        // Mouse leave event
        canvas.addEventListener('mouseleave', function() {
            if (hoveredLetter) {
                hoveredLetter = null;
                drawGrid();
            }
        });
        
        // Initialize with sample data
        drawGrid();
    </script>
</body>
</html>
