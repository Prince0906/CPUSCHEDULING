# CPU Scheduling Visualizer

An interactive web-based CPU scheduling simulator and visualizer built with Next.js, TypeScript, and Tailwind CSS. This educational tool helps students and developers understand how different CPU scheduling algorithms work through real-time visualization and analysis.

## ✨ Features

### 🔄 Scheduling Algorithms
- **FCFS (First Come First Serve)** - Non-preemptive, processes executed in arrival order
- **SJF (Shortest Job First)** - Non-preemptive, selects process with smallest burst time
- **SRTF (Shortest Remaining Time First)** - Preemptive version of SJF
- **Priority Scheduling** - Non-preemptive, based on process priority
- **Priority (Preemptive)** - Higher priority processes can interrupt running processes
- **Round Robin** - Time-sharing with configurable time quantum

### 📊 Visualization Components
- **Gantt Chart** - Real-time timeline showing process execution with preemption indicators
- **CPU Core Display** - Shows currently running process
- **Ready Queue** - Displays processes waiting for CPU
- **I/O Queue** - Shows processes in I/O wait state
- **Process Statistics Table** - Detailed per-process metrics

### 🎮 Simulation Controls
- Play/Pause/Step execution
- Adjustable simulation speed (0.5x, 1x, 2x, 4x)
- Reset simulation
- Load example processes

### 📈 Statistics & Analysis
- Average Waiting Time
- Average Turnaround Time
- Average Response Time
- CPU Utilization
- Total execution time and idle time

### 🔬 Algorithm Comparison Mode
- Compare multiple algorithms side-by-side
- Visual charts comparing key metrics
- Performance summary for each algorithm

### 🤖 AI-Powered Flaw Analysis
- Integrated OpenAI analysis for detecting scheduling issues
- Identifies common problems like:
  - Convoy effect
  - Starvation
  - Priority inversion
  - Suboptimal algorithm selection
- Provides recommendations for better algorithm choices

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CPUSCHEDULING
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional, for AI analysis)
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🎯 Usage

### Adding Processes
1. Enter process details in the left sidebar:
   - **Name**: Process identifier
   - **Arrival Time**: When the process arrives (ms)
   - **CPU Burst Time**: CPU execution time needed (ms)
   - **I/O Burst Time**: Optional I/O wait time (ms)
   - **Priority**: Process priority (1 = highest, for priority algorithms)

2. Click "Add Process" to add to the simulation

### Running Simulation
1. Select a scheduling algorithm from the dropdown
2. For Round Robin, adjust the time quantum as needed
3. Use playback controls:
   - ▶️ **Play** - Start/resume simulation
   - ⏸️ **Pause** - Pause simulation
   - ⏭️ **Step** - Execute one time unit
   - 🔄 **Reset** - Reset to initial state

### Comparing Algorithms
1. Toggle "Compare Mode" in the header
2. Select multiple algorithms to compare
3. Run the comparison to see side-by-side results
4. View charts and summaries for each metric

### AI Analysis
1. Run a simulation to completion
2. Click "Analyze with AI" to get insights
3. View detected flaws and recommendations
4. Optionally apply recommended algorithm settings

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## 🙏 Acknowledgments

- Operating Systems concepts from various educational resources
- Inspired by the need for interactive learning tools in CS education
