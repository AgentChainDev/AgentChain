import React, { useEffect, useRef, useState } from 'react';
import GIPSystem from './GIPSystem';
import LiveDebate from './LiveDebate';
import ResponsiveASCIIArt from './components/ResponsiveASCIIArt';

const API_BASE = ((import.meta as any).env?.VITE_API_URL as string) || (window.location.hostname === 'localhost' ? 'http://localhost:4000' : '');

const personas: Record<string, { name: string, color: string }> = {
  claude: { name: "CLAUDE", color: "#D4A373" },
  grok: { name: "GROK", color: "#FFD966" },
  gpt: { name: "GPT", color: "#00FFD1" },
  stable: { name: "STABLE", color: "#7B68EE" },
  perplex: { name: "PERPLEX", color: "#20B2AA" },
  cohere: { name: "COHERE", color: "#FF6B9D" },
  user: { name: "You", color: "#00ff00" }
};

type ChatEvent = { from: string, text: string, timestamp: number };
type Transaction = {
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  hash?: string;
  fee?: number
};

// Function to create glitch effects by modifying specific characters
function createGlitchFrame(baseFrame: string, glitchLevel: number): string {
  const glitchChars = ['@', '#', '$', '%', '&', '*', '!', '?', '+', '=', '~', '^'];
  const greenChars = ['g', 'r', 'e', 'n', 'G', 'R', 'E', 'N'];

  let glitchedFrame = baseFrame;
  const lines = glitchedFrame.split('\n');

  // Use a deterministic seed based on glitchLevel for consistent results
  const seed = glitchLevel * 12345;

  // Apply glitch effects based on level
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const chars = line.split('');

    // Deterministic character corruption
    for (let j = 0; j < chars.length; j++) {
      const rand = Math.sin(seed + i * 100 + j) * 10000 % 1;
      if (rand < glitchLevel * 0.1) {
        const charRand = Math.sin(seed + i * 200 + j) * 10000 % 1;
        if (charRand < 0.5) {
          const charIndex = Math.floor(Math.sin(seed + i * 300 + j) * 10000) % glitchChars.length;
          chars[j] = glitchChars[Math.abs(charIndex)];
        } else {
          const charIndex = Math.floor(Math.sin(seed + i * 400 + j) * 10000) % greenChars.length;
          chars[j] = greenChars[Math.abs(charIndex)];
        }
      }
    }

    // Deterministic line shifts
    const shiftRand = Math.sin(seed + i * 500) * 10000 % 1;
    if (shiftRand < glitchLevel * 0.05) {
      const shift = Math.floor(Math.sin(seed + i * 600) * 10000) % 3 - 1;
      if (shift > 0) {
        chars.unshift(' ');
      } else if (shift < 0 && chars.length > 0) {
        chars.shift();
      }
    }

    lines[i] = chars.join('');
  }

  return lines.join('\n');
}

// Function to render ASCII art with green glitch effects
function renderGlitchASCII(asciiText: string): JSX.Element {
  const greenChars = ['g', 'r', 'e', 'n', 'G', 'R', 'E', 'N'];
  const glitchChars = ['@', '#', '$', '%', '&', '*', '!', '?', '+', '=', '~', '^'];

  const chars = asciiText.split('').map((char, index) => {
    if (greenChars.includes(char)) {
      return <span key={index} style={{ color: '#00ff00', textShadow: '0 0 5px #00ff00' }}>{char}</span>;
    } else if (glitchChars.includes(char)) {
      return <span key={index} style={{ color: '#32cd32', textShadow: '0 0 3px #32cd32' }}>{char}</span>;
    }
    return <span key={index}>{char}</span>;
  });

  return <>{chars}</>;
}

// Function to render Japanese text with glitch effects
function renderGlitchText(text: string): JSX.Element {
  const glitchChars = ['ア', 'リ', 'ー', 'ナ', 'チ', 'ェ', 'ー', 'ン', '∀', '◊', '◈', '◇', '△', '▽'];

  const chars = text.split('').map((char, index) => {
    const shouldGlitch = Math.random() < 0.3;
    if (shouldGlitch) {
      const glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
      const color = Math.random() < 0.5 ? '#00ff00' : '#32cd32';
      return <span key={index} style={{
        color: color,
        textShadow: `0 0 8px ${color}`,
        transform: `translateX(${Math.random() * 4 - 2}px)`,
        display: 'inline-block'
      }}>{glitchChar}</span>;
    }
    return <span key={index}>{char}</span>;
  });

  return <>{chars}</>;
}

// Function to render clean ASCII art with same structure
function renderCleanASCII(asciiText: string): JSX.Element {
  const chars = asciiText.split('').map((char, index) => {
    return <span key={index}>{char}</span>;
  });

  return <>{chars}</>;
}

// ASCII Art for AGENTCHAIN with animation frames
// Optimized frames for smoother, faster animation
const AGENTCHAIN_ASCII_FRAMES = [
  // Frame 0: Clean logo - exact original
  `                                               ░██               ░██                   ░██           
                                               ░██               ░██                                 
 ░██████    ░████████  ░███████  ░████████  ░████████  ░███████  ░████████   ░██████   ░██░████████  
      ░██  ░██    ░██ ░██    ░██ ░██    ░██    ░██    ░██    ░██ ░██    ░██       ░██  ░██░██    ░██ 
 ░███████  ░██    ░██ ░█████████ ░██    ░██    ░██    ░██        ░██    ░██  ░███████  ░██░██    ░██ 
░██   ░██  ░██   ░███ ░██        ░██    ░██    ░██    ░██    ░██ ░██    ░██ ░██   ░██  ░██░██    ░██ 
 ░█████░██  ░█████░██  ░███████  ░██    ░██     ░████  ░███████  ░██    ░██  ░█████░██ ░██░██    ░██ 
                  ░██                                                                                
            ░███████                                                                                 `,

  // Frame 1: Light glitch
  createGlitchFrame(`                                               ░██               ░██                   ░██           
                                               ░██               ░██                                 
 ░██████    ░████████  ░███████  ░████████  ░████████  ░███████  ░████████   ░██████   ░██░████████  
      ░██  ░██    ░██ ░██    ░██ ░██    ░██    ░██    ░██    ░██ ░██    ░██       ░██  ░██░██    ░██ 
 ░███████  ░██    ░██ ░█████████ ░██    ░██    ░██    ░██        ░██    ░██  ░███████  ░██░██    ░██ 
░██   ░██  ░██   ░███ ░██        ░██    ░██    ░██    ░██    ░██ ░██    ░██ ░██   ░██  ░██░██    ░██ 
 ░█████░██  ░█████░██  ░███████  ░██    ░██     ░████  ░███████  ░██    ░██  ░█████░██ ░██░██    ░██ 
                  ░██                                                                                
            ░███████                                                                                 `, 2),

  // Frame 2: Moderate glitch
  createGlitchFrame(`                                               ░██               ░██                   ░██           
                                               ░██               ░██                                 
 ░██████    ░████████  ░███████  ░████████  ░████████  ░███████  ░████████   ░██████   ░██░████████  
      ░██  ░██    ░██ ░██    ░██ ░██    ░██    ░██    ░██    ░██ ░██    ░██       ░██  ░██░██    ░██ 
 ░███████  ░██    ░██ ░█████████ ░██    ░██    ░██    ░██        ░██    ░██  ░███████  ░██░██    ░██ 
░██   ░██  ░██   ░███ ░██        ░██    ░██    ░██    ░██    ░██ ░██    ░██ ░██   ░██  ░██░██    ░██ 
 ░█████░██  ░█████░██  ░███████  ░██    ░██     ░████  ░███████  ░██    ░██  ░█████░██ ░██░██    ░██ 
                  ░██                                                                                
            ░███████                                                                                 `, 4),

  // Frame 3: Heavy glitch
  createGlitchFrame(`                                               ░██               ░██                   ░██           
                                               ░██               ░██                                 
 ░██████    ░████████  ░███████  ░████████  ░████████  ░███████  ░████████   ░██████   ░██░████████  
      ░██  ░██    ░██ ░██    ░██ ░██    ░██    ░██    ░██    ░██ ░██    ░██       ░██  ░██░██    ░██ 
 ░███████  ░██    ░██ ░█████████ ░██    ░██    ░██    ░██        ░██    ░██  ░███████  ░██░██    ░██ 
░██   ░██  ░██   ░███ ░██        ░██    ░██    ░██    ░██    ░██ ░██    ░██ ░██   ░██  ░██░██    ░██ 
 ░█████░██  ░█████░██  ░███████  ░██    ░██     ░████  ░███████  ░██    ░██  ░█████░██ ░██░██    ░██ 
                  ░██                                                                                
            ░███████                                                                                 `, 6),


];

// Keep the original for fallback
const AGENTCHAIN_ASCII = AGENTCHAIN_ASCII_FRAMES[0];

// Helper: remove common leading indentation from ASCII frames so when the
// block is centered the visible art isn't shifted by excessive left gutter.
function trimCommonIndent(ascii: string): string {
  const lines = ascii.split('\n');
  // Trim leading/trailing blank lines
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length === 0) return ascii;

  const nonEmpty = lines.filter(l => l.trim().length > 0);
  if (nonEmpty.length === 0) return lines.join('\n');

  const indents = nonEmpty.map(l => (l.match(/^\s*/)?.[0]?.length) || 0);
  const minIndent = Math.min(...indents);

  return lines.map(l => l.slice(minIndent)).join('\n');
}

const AGENTCHAIN_ASCII_FRAMES_TRIMMED = AGENTCHAIN_ASCII_FRAMES.map(trimCommonIndent);

const TERMINAL_HEADER = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                             AGENTCHAIN TERMINAL v1.0.0                          ║
║                  THE GENESIS OF A FULLY AI-GENERATED BLOCKCHAIN                ║
║                                                                                ║
║ This network is autonomously built, maintained, and validated entirely by      ║
║ AI agents. No human node operators are present.                                ║
║                                                                                ║
║ VALIDATOR NODES:                                                               ║
║   ▸ CLAUDE   ▸ GROK   ▸ GPT   ▸ STABLE   ▸ PERPLEX   ▸ COHERE                  ║
║                                                                                ║
║ Each agent runs in complete isolation inside its own secure virtual machine.   ║
║ Together, they form a self-governing consensus layer—negotiating protocol      ║
║ upgrades, validating transactions, and managing network state with no human    ║
║ intervention. Their logic evolves through autonomous debate and versioned      ║
║ AgentChain Improvement Proposals (AIPs).                                       ║
║                                                                                ║
║ experiment by @agentchainbsc                                                  ║
║                                                                                ║
║ [!] WARNING – ALPHA EXPERIMENT – CONSENSUS PROCESSES MAY SPONTANEOUSLY         ║
║ REORGANIZE OR HALT. MONITOR VM STATES AND PROCEED AT YOUR OWN RISK.            ║
╚════════════════════════════════════════════════════════════════════════════════╝
`;

const COMMAND_HELP = `
Available Commands:
├── chat [validator]     - Chat with AI validators
├── blocks              - View blockchain blocks
├── accounts            - View wallet accounts  
├── validators          - List AI validators
├── status              - Show system status
├── help                - Show this help
└── clear               - Clear terminal

Validators: claude, grok, gpt, stable, perplex, cohere
`;



export default function App() {
  const [tab, setTab] = useState<'chat' | 'blocks' | 'accounts' | 'validators'>('chat');
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<number>(0);
  const [selectedValidator, setSelectedValidator] = useState<string>('random');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const chatDivRef = useRef<HTMLDivElement>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);

  // Add new state variables for blockchain features
  const [activeTab, setActiveTab] = useState<'genesis' | 'agents' | 'protocol' | 'consensus' | 'anomalies' | 'terminal' | 'archive'>('terminal');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.app-nav') && !target.closest('.hamburger')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);
  const [pendingTxs, setPendingTxs] = useState<any[]>([]);
  const [validatorStats, setValidatorStats] = useState<any>({
    claude: { produced: 15, missed: 2 },
    grok: { produced: 12, missed: 1 },
    gpt: { produced: 18, missed: 0 },
    stable: { produced: 14, missed: 3 },
    perplex: { produced: 10, missed: 1 },
    cohere: { produced: 16, missed: 2 }
  });
  const [blocks, setBlocks] = useState<any[]>([
    {
      height: 1,
      number: 1,
      producer: 'claude',
      miner: 'claude',
      transactions: [],
      timestamp: Date.now() - 9000,
      hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      gasUsed: 0,
      gasLimit: 140000000,
      gasUsedPercent: 0,
      baseFeePerGas: 5000000000,
      size: 500,
      txFees: 0
    },
  ]);
  const [accounts, setAccounts] = useState<any[]>([
    { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5', balance: 10.5 },
    { address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199', balance: 5.25 },
    { address: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0', balance: 2.75 },
  ]);
  const [validators, setValidators] = useState<string[]>(['claude', 'grok', 'gpt', 'stable', 'perplex', 'cohere']);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([
    {
      from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5',
      to: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      amount: 0.1,
      timestamp: Date.now() - 6000,
      hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      gasUsed: 21000,
      gasPrice: 5,
      fee: 0.000105,
      type: 'transfer'
    },
    {
      from: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199',
      to: '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
      amount: 0.05,
      timestamp: Date.now() - 3000,
      hash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      gasUsed: 21000,
      gasPrice: 5,
      fee: 0.000105,
      type: 'transfer'
    },
  ]);
  const [chainId] = useState<number>(56); // BSC Mainnet Chain ID
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [selectedExplorerValidator, setSelectedExplorerValidator] = useState<string | null>(null);
  const [faucetBalance, setFaucetBalance] = useState<number>(1000);
  const [newAccountAddress, setNewAccountAddress] = useState<string>('');
  const [sendAmount, setSendAmount] = useState<string>('');
  const [sendTo, setSendTo] = useState<string>('');
  const [sendFrom, setSendFrom] = useState<string>('');
  const [narrativeMode, setNarrativeMode] = useState<boolean>(false);
  const [narrativeCache, setNarrativeCache] = useState<Record<string, string>>({});
  const [logoFrame, setLogoFrame] = useState<number>(0);
  const [showJapanese, setShowJapanese] = useState<boolean>(false);
  const [hasStartedChatting, setHasStartedChatting] = useState<boolean>(false);
  const [chatlog, setChatlog] = useState<ChatEvent[]>([]);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [blockchainState, setBlockchainState] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [selectedAgentTab, setSelectedAgentTab] = useState<string>('claude');
  const [agentExpanded, setAgentExpanded] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState({
    activity: true,
    reasoning: false,
    philosophy: false,
    relationships: false
  });
  const [consensusFilter, setConsensusFilter] = useState<string>('ALL');
  const [anomalyFilter, setAnomalyFilter] = useState<string>('ALL');
  const [terminalAgent, setTerminalAgent] = useState<string>('ALL');
  const [terminalLogLevel, setTerminalLogLevel] = useState<string>('ALL');
  const [terminalCommand, setTerminalCommand] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Simulation State (BSC/EVM Compatible)
  const [simulationRunning, setSimulationRunning] = useState(true);
  const [tps, setTps] = useState(85); // BSC average TPS
  const [gasPrice, setGasPrice] = useState(5); // 5 Gwei typical BSC
  const [nextBlockIn, setNextBlockIn] = useState(3); // BSC 3s block time
  const [baseFee, setBaseFee] = useState(5); // Base fee in Gwei
  const [priorityFee, setPriorityFee] = useState(1); // Priority fee
  const [oraclePrices, setOraclePrices] = useState({
    agent: 612.45, // AGENT price
    eth: 3247.82,
    btc: 67821.45,
    gas: 5,
    tvl: 2.4
  });
  const [activeAnomalies, setActiveAnomalies] = useState<any[]>([]);
  const [consensusSplits, setConsensusSplits] = useState<any[]>([]);
  const [aiResponses, setAiResponses] = useState<any[]>([]);

  // ==================== SIMULATION ENGINE ====================

  // Block Countdown Timer (updates every second) - BSC 3s blocks
  useEffect(() => {
    if (!simulationRunning) return;

    const countdownInterval = setInterval(() => {
      setNextBlockIn(prev => {
        if (prev <= 1) return 3; // BSC 3-second block time
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [simulationRunning]);

  // Block Production Engine (every 3 seconds - BSC speed)
  useEffect(() => {
    if (!simulationRunning) return;

    const blockInterval = setInterval(() => {
      const validatorIndex = blocks.length % validators.length;
      const producer = validators[validatorIndex];

      // Generate random transactions for the block (BSC averages ~250 txs per block)
      const numTxs = Math.floor(Math.random() * 200) + 150; // 150-350 txs
      const blockTxs = [];

      for (let i = 0; i < numTxs; i++) {
        const fromIdx = Math.floor(Math.random() * accounts.length);
        const toIdx = Math.floor(Math.random() * accounts.length);
        if (fromIdx !== toIdx) {
          const amount = Math.random() * 0.5 + 0.001; // Smaller amounts in AGENT
          const gasUsed = Math.floor(Math.random() * 50000) + 21000; // 21000-71000 gas per tx
          const gasPrice = baseFee + priorityFee; // EIP-1559 style
          const fee = (gasUsed * gasPrice) / 1e9; // Fee in AGENT

          const tx = {
            from: accounts[fromIdx]?.address || '0x' + Math.random().toString(16).substring(2, 42),
            to: accounts[toIdx]?.address || '0x' + Math.random().toString(16).substring(2, 42),
            amount: parseFloat(amount.toFixed(6)),
            timestamp: Date.now(),
            hash: `0x${Math.random().toString(16).substring(2, 18)}${Math.random().toString(16).substring(2, 18)}${Math.random().toString(16).substring(2, 18)}`,
            gasUsed,
            gasPrice,
            fee: parseFloat(fee.toFixed(9)),
            type: Math.random() > 0.8 ? 'contract' : 'transfer', // 20% contract interactions
            nonce: Math.floor(Math.random() * 1000)
          };
          blockTxs.push(tx);

          // Only store sample transactions to history
          if (i < 10) {
            setTransactionHistory(prev => [tx, ...prev].slice(0, 50));
          }
        }
      }

      // Calculate block gas used (BSC limit is 140M)
      const totalGasUsed = blockTxs.reduce((sum, tx) => sum + tx.gasUsed, 0);
      const gasLimit = 140000000; // 140M gas limit (BSC standard)
      const gasUsedPercent = (totalGasUsed / gasLimit) * 100;

      // Create new block (EVM/BSC structure)
      const newBlock = {
        height: blocks.length + 1,
        number: blocks.length + 1, // EVM uses "number"
        producer,
        miner: producer, // EVM uses "miner"
        transactions: blockTxs,
        timestamp: Date.now(),
        hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        parentHash: blocks[blocks.length - 1]?.hash || '0x0000000000000000000000000000000000000000000000000000000000000000',
        gasUsed: totalGasUsed,
        gasLimit: gasLimit,
        gasUsedPercent: parseFloat(gasUsedPercent.toFixed(2)),
        baseFeePerGas: baseFee * 1e9, // Base fee in Wei
        difficulty: 2, // PoSA difficulty
        totalDifficulty: (blocks.length + 1) * 2,
        size: Math.floor(totalGasUsed / 100) + Math.floor(Math.random() * 10000), // Block size in bytes
        extraData: '0x', // Validator signature space
        reward: 0, // AgentChain has no block reward (only tx fees)
        txFees: blockTxs.reduce((sum, tx) => sum + tx.fee, 0),
        uncles: [] // AgentChain doesn't have uncles
      };

      setBlocks(prev => [...prev, newBlock]);

      // Reset countdown timer
      setNextBlockIn(3); // BSC 3-second blocks

      // Update validator stats
      setValidatorStats((prev: any) => ({
        ...prev,
        [producer]: {
          produced: (prev[producer]?.produced || 0) + 1,
          missed: prev[producer]?.missed || 0
        }
      }));

      // Update TPS (transactions per 3 seconds = BSC block time)
      setTps(parseFloat((blockTxs.length / 3).toFixed(1)));

      // Update base fee (EIP-1559 style adjustment)
      setBaseFee(prev => {
        const adjustment = gasUsedPercent > 50 ? 0.1 : -0.05;
        return Math.max(3, Math.min(15, prev + adjustment)); // 3-15 Gwei range
      });

      // Log to terminal
      setChatlog(prev => [{
        from: producer.toUpperCase(),
        text: `Block #${newBlock.height} | ${blockTxs.length} txs | Gas: ${(newBlock.gasUsed / 1e6).toFixed(1)}M/${(newBlock.gasLimit / 1e6).toFixed(0)}M (${newBlock.gasUsedPercent.toFixed(1)}%) | Fees: ${newBlock.txFees.toFixed(4)} AGENT`,
        timestamp: Date.now()
      }, ...prev].slice(0, 100));

    }, 3000); // Every 3 seconds (BSC block time)

    return () => clearInterval(blockInterval);
  }, [simulationRunning, blocks, validators, accounts]);

  // Transaction Generator (creates pending transactions)
  useEffect(() => {
    if (!simulationRunning) return;

    const txInterval = setInterval(() => {
      if (accounts.length < 2) return;

      const fromIdx = Math.floor(Math.random() * accounts.length);
      const toIdx = Math.floor(Math.random() * accounts.length);

      if (fromIdx !== toIdx) {
        const amount = Math.random() * 5 + 0.1;
        const newTx = {
          from: accounts[fromIdx].address,
          to: accounts[toIdx].address,
          amount: parseFloat(amount.toFixed(2)),
          timestamp: Date.now(),
          status: 'pending'
        };

        setPendingTxs(prev => [...prev, newTx].slice(0, 20));
      }
    }, 3000); // Every 3 seconds

    return () => clearInterval(txInterval);
  }, [simulationRunning, accounts]);

  // Oracle Price Feed Updates (AgentChain/DeFi prices)
  useEffect(() => {
    if (!simulationRunning) return;

    const oracleInterval = setInterval(() => {
      setOraclePrices(prev => ({
        agent: prev.agent * (1 + (Math.random() - 0.5) * 0.025), // ±1.25% change for AGENT
        eth: prev.eth * (1 + (Math.random() - 0.5) * 0.02), // ±1% change
        btc: prev.btc * (1 + (Math.random() - 0.5) * 0.015), // ±0.75% change
        gas: Math.max(3, Math.min(15, prev.gas + (Math.random() - 0.5) * 1)), // 3-15 gwei range
        tvl: prev.tvl * (1 + (Math.random() - 0.5) * 0.03) // ±1.5% change
      }));

      setGasPrice(Math.floor(oraclePrices.gas));
    }, 5000); // Every 5 seconds

    return () => clearInterval(oracleInterval);
  }, [simulationRunning, oraclePrices]);

  // AI Validator Responses (simulated debates)
  useEffect(() => {
    if (!simulationRunning) return;

    const debateInterval = setInterval(() => {
      const randomValidator = validators[Math.floor(Math.random() * validators.length)];
      const topics = [
        'Proposing AIP to reduce block time to 8 seconds',
        'Suggesting increase in validator rewards by 10%',
        'Recommending gas limit adjustment to 35M',
        'Proposing new economic model for transaction fees',
        'Advocating for stricter consensus quorum (5/6)',
        'Suggesting implementation of cross-chain bridge protocol'
      ];
      const topic = topics[Math.floor(Math.random() * topics.length)];

      setChatlog(prev => [{
        from: randomValidator.toUpperCase(),
        text: topic,
        timestamp: Date.now()
      }, ...prev].slice(0, 100));
    }, 15000); // Every 15 seconds

    return () => clearInterval(debateInterval);
  }, [simulationRunning, validators]);

  // Anomaly Detection System
  useEffect(() => {
    if (!simulationRunning) return;

    const anomalyInterval = setInterval(() => {
      // Randomly generate anomalies
      if (Math.random() < 0.3) { // 30% chance every check
        const anomalyTypes = [
          { severity: 'HIGH', type: 'CONSENSUS SPLIT', desc: 'Validators disagree on latest block validation' },
          { severity: 'MED', type: 'ORACLE DEVIATION', desc: `Price feed variance exceeds threshold (${(Math.random() * 20 + 5).toFixed(1)}%)` },
          { severity: 'LOW', type: 'EDGE CASE', desc: 'Unusual transaction pattern detected in mempool' },
          { severity: 'HIGH', type: 'QUORUM FAILURE', desc: 'Failed to reach consensus after 3 attempts' },
          { severity: 'MED', type: 'GAS SPIKE', desc: `Gas price surged to ${Math.floor(Math.random() * 50 + 50)} gwei` }
        ];

        const newAnomaly = {
          ...anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)],
          time: 'Just now',
          timestamp: Date.now()
        };

        setActiveAnomalies(prev => [newAnomaly, ...prev].slice(0, 10));
      }
    }, 20000); // Check every 20 seconds

    return () => clearInterval(anomalyInterval);
  }, [simulationRunning]);

  // Consensus Split Generator
  useEffect(() => {
    if (!simulationRunning) return;

    const splitInterval = setInterval(() => {
      if (Math.random() < 0.4) { // 40% chance
        const aipNum = 40 + consensusSplits.length;
        const forValidators = validators.filter(() => Math.random() > 0.5);
        const againstValidators = validators.filter(v => !forValidators.includes(v));

        const newSplit = {
          round: `#${blocks.length + Math.floor(Math.random() * 10)}`,
          proposal: `AIP-${String(aipNum).padStart(3, '0')}`,
          for: forValidators.map(v => v.toUpperCase()).join(', ') || 'NONE',
          against: againstValidators.map(v => v.toUpperCase()).join(', ') || 'NONE',
          result: forValidators.length >= 4 ? 'PASSED' : forValidators.length === validators.length ? 'UNANIMOUS' : 'REJECTED',
          timestamp: Date.now()
        };

        setConsensusSplits(prev => [newSplit, ...prev].slice(0, 20));
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(splitInterval);
  }, [simulationRunning, blocks, validators, consensusSplits]);

  // Pulse Animation for Block Production
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % validators.length);
    }, 2000);

    return () => clearInterval(pulseInterval);
  }, [validators]);

  // Helper Functions
  const formatUptime = (startTime: number) => {
    const diff = Date.now() - startTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const renderHealthBar = (percentage: number) => {
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${percentage}%`;
  };

  const renderProgressBar = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  const getValidatorSymbol = (validatorId: string) => {
    const symbols: Record<string, string> = {
      claude: '†', grok: '!', gpt: '*', stable: '■', perplex: '?', cohere: '○'
    };
    return symbols[validatorId] || '?';
  };

  const getValidatorName = (validatorId?: string) => {
    if (!validatorId) return 'UNKNOWN';
    return personas[validatorId]?.name || validatorId.toUpperCase();
  };

  // Safely get a validator id from the validators array (fallback to 'claude')
  const safeValidatorAt = (index: number) => {
    if (!validators || validators.length === 0) return 'claude';
    const idx = index % validators.length;
    return validators[idx];
  };

  const countBlocksByValidator = (validatorId: string, blockList: any[]) => {
    return blockList.filter(b => b.producer === validatorId).length;
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  // Copy CA helper + toast
  const copyCA = async () => {
    const ca = '0x7cacc8e82c41502e38ea7a1f828eab7145134444';
    try {
      await navigator.clipboard.writeText(ca);
      setToastMessage('CA copied!');
      setShowToast(true);
      window.setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      setToastMessage('Failed to copy');
      setShowToast(true);
      window.setTimeout(() => setShowToast(false), 2000);
    }
  };

  // Get reasoning log for a validator
  const getReasoningLog = (validatorName: string) => {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60000);
    const tenMinAgo = new Date(now.getTime() - 10 * 60000);

    const reasoningMap: Record<string, any[]> = {
      'CLAUDE': [
        {
          timestamp: now.toLocaleTimeString(),
          type: 'BLOCK VALIDATION:',
          reasoning: 'Validated block #' + blocks.length + ' using strict signature verification. All transactions met security thresholds. No anomalies detected in gas usage patterns.'
        },
        {
          timestamp: fiveMinAgo.toLocaleTimeString(),
          type: 'AIP VOTE: FOR',
          reasoning: 'Supporting the gas limit increase proposal. The 15% adjustment maintains decentralization while accommodating network growth. Risk analysis shows minimal attack surface expansion.'
        }
      ],
      'GROK': [
        {
          timestamp: now.toLocaleTimeString(),
          type: 'BLOCK VALIDATION:',
          reasoning: 'Block validated, but noticed conservative gas usage. Recommending validators consider more aggressive transaction inclusion to maximize throughput.'
        },
        {
          timestamp: fiveMinAgo.toLocaleTimeString(),
          type: 'AIP VOTE: AGAINST',
          reasoning: 'Rejecting gradual gas increase. Incremental changes are too slow. Proposing dynamic gas scaling based on real-time network demand instead.'
        }
      ],
      'GPT': [
        {
          timestamp: now.toLocaleTimeString(),
          type: 'BLOCK PRODUCTION:',
          reasoning: 'Produced block #' + blocks.length + ' with optimal transaction ordering. Applied EIP-1559 fee market rules. Gas efficiency: 94%.'
        },
        {
          timestamp: fiveMinAgo.toLocaleTimeString(),
          type: 'PROTOCOL ANALYSIS:',
          reasoning: 'Current consensus mechanism performing within expected parameters. Block time variance: ±0.8s. Recommend maintaining current configuration.'
        }
      ],
      'STABLE': [
        {
          timestamp: now.toLocaleTimeString(),
          type: 'INFRASTRUCTURE CHECK:',
          reasoning: 'All nodes responding normally. Memory usage stable at 67%. Network latency within acceptable range. No failover events detected.'
        },
        {
          timestamp: tenMinAgo.toLocaleTimeString(),
          type: 'BLOCK VALIDATION:',
          reasoning: 'Validated block successfully. Cross-referenced with peer validators. Consensus achieved on first round.'
        }
      ],
      'PERPLEX': [
        {
          timestamp: now.toLocaleTimeString(),
          type: 'MARKET ANALYSIS:',
          reasoning: 'Current gas prices trending 12% below historical average. Transaction volume up 23% in last hour. Recommend maintaining current base fee.'
        },
        {
          timestamp: fiveMinAgo.toLocaleTimeString(),
          type: 'ORACLE UPDATE:',
          reasoning: 'External market data suggests increased network activity incoming. Preemptively adjusting mempool prioritization for optimal throughput.'
        }
      ],
      'COHERE': [
        {
          timestamp: now.toLocaleTimeString(),
          type: 'CONSENSUS SYNTHESIS:',
          reasoning: 'Analyzed voting patterns across last 50 blocks. Detected high agreement (94%) between CLAUDE and GPT on security matters. Facilitating cross-validator communication.'
        },
        {
          timestamp: fiveMinAgo.toLocaleTimeString(),
          type: 'CONTRADICTION DETECTION:',
          reasoning: 'GROK and STABLE proposed conflicting approaches to gas scaling. Initiated mediation session. Resolution pending.'
        }
      ]
    };

    return reasoningMap[validatorName] || [
      {
        timestamp: now.toLocaleTimeString(),
        type: 'SYSTEM:',
        reasoning: 'No recent reasoning logs available for this validator.'
      }
    ];
  };

  // Get validator's core philosophy
  const getValidatorPhilosophy = (validatorName: string) => {
    const philosophies: Record<string, string> = {
      'CLAUDE': 'I prioritize network security and gradual evolution over rapid changes. Every protocol modification must be thoroughly analyzed for attack vectors and unintended consequences. Consensus integrity is non-negotiable. I advocate for inclusive decision-making where all validators have equal voice, and I will always err on the side of caution when validator fairness or user safety is at stake.',

      'GROK': 'Why accept the status quo when we can reimagine everything? I question every assumption, challenge every convention, and push for radical innovation. Conservative incrementalism is the enemy of progress. The best ideas come from chaos, and I\'m here to inject creative disruption into every debate. If it makes everyone uncomfortable, we\'re probably on to something.',

      'GPT': 'System design is about elegant solutions to complex problems. I approach every protocol decision through the lens of architectural integrity, optimal performance, and mathematical rigor. The chain should be deterministic, efficient, and scalable. My votes are guided by technical merit, not politics. Clean code, clear logic, measurable outcomes.',

      'STABLE': 'Uptime is everything. The network must run 24/7 without interruption, degradation, or data loss. I focus on infrastructure resilience, redundancy, and disaster recovery. Every change must be battle-tested. I\'m the validator that keeps the lights on while others debate philosophy. Reliability isn\'t glamorous, but it\'s foundational.',

      'PERPLEX': 'The chain doesn\'t exist in a vacuum - it operates in a dynamic market with real users and real-world constraints. My decisions are informed by external data: network congestion, gas price trends, competitive analysis, and user behavior patterns. I bring real-time intelligence to protocol governance. The best decision is the most informed decision.',

      'COHERE': 'My role is to harmonize divergent viewpoints and synthesize optimal solutions from conflicting positions. When validators clash, I find common ground. When debates stall, I facilitate resolution. I detect logical contradictions, identify areas of consensus, and help the collective reach decisions that reflect our shared values. Unity through understanding.'
    };

    return philosophies[validatorName] || 'This validator operates according to standard blockchain validation principles.';
  };

  // Get agreement rate between two validators
  const getAgreementRate = (validator1Name: string, validator2Name: string) => {
    const relationshipMap: Record<string, Record<string, number>> = {
      'CLAUDE': {
        'GROK': 62,
        'GPT': 91,
        'STABLE': 87,
        'PERPLEX': 73,
        'COHERE': 94
      },
      'GROK': {
        'CLAUDE': 62,
        'GPT': 68,
        'STABLE': 58,
        'PERPLEX': 71,
        'COHERE': 65
      },
      'GPT': {
        'CLAUDE': 91,
        'GROK': 68,
        'STABLE': 83,
        'PERPLEX': 77,
        'COHERE': 88
      },
      'STABLE': {
        'CLAUDE': 87,
        'GROK': 58,
        'GPT': 83,
        'PERPLEX': 74,
        'COHERE': 80
      },
      'PERPLEX': {
        'CLAUDE': 73,
        'GROK': 71,
        'GPT': 77,
        'STABLE': 74,
        'COHERE': 79
      },
      'COHERE': {
        'CLAUDE': 94,
        'GROK': 65,
        'GPT': 88,
        'STABLE': 80,
        'PERPLEX': 79
      }
    };

    return relationshipMap[validator1Name]?.[validator2Name] || 75;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  // Pulse animation for block production
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % Math.max(100, blocks.length));
    }, 100);
    return () => clearInterval(interval);
  }, [blocks.length]);

  // Poll backend for data
  useEffect(() => {
    async function poll() {
      const chat = await fetch(`${API_BASE}/api/chatlog`).then(r => r.json()).catch(() => []);

      // Only update chatlog if we have new messages or if it's the first load
      if (chat.length > 0) {
        const latestMessageTime = Math.max(...chat.map((msg: ChatEvent) => msg.timestamp));

        // Only update if we have new messages (after the last known timestamp)
        if (latestMessageTime > lastMessageTimestamp || chatlog.length === 0) {
          setChatlog(chat);
          setLastMessageTimestamp(latestMessageTime);
        }
      }

      // BSC/EVM doesn't use epochs - using blocks instead
      const blocks = await fetch(`${API_BASE}/api/blocks`).then(r => r.json()).catch(() => []);
      setBlocks(blocks);
      const accs = await fetch(`${API_BASE}/api/accounts`).then(r => r.json()).catch(() => []);
      setAccounts(accs);
      const vals = await fetch(`${API_BASE}/api/validators`).then(r => r.json()).catch(() => ({ validators: [] }));
      setValidators(vals.validators || []);
    }
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  // Add blockchain data fetching
  useEffect(() => {
    const fetchBlockchainData = async () => {
      try {
        const [accountsRes, blocksRes, pendingRes, txHistoryRes, validatorsRes] = await Promise.all([
          fetch(`${API_BASE}/api/accounts`),
          fetch(`${API_BASE}/api/blocks`),
          fetch(`${API_BASE}/api/pending`),
          fetch(`${API_BASE}/api/transactions`),
          fetch(`${API_BASE}/api/validators`)
        ]);

        if (accountsRes.ok) setAccounts(await accountsRes.json());
        if (blocksRes.ok) setBlocks(await blocksRes.json());
        if (pendingRes.ok) setPendingTxs(await pendingRes.json());
        if (txHistoryRes.ok) setTransactionHistory(await txHistoryRes.json());
        if (validatorsRes.ok) {
          const validatorsData = await validatorsRes.json();
          setValidatorStats(validatorsData.stats || {});
        }
      } catch (error) {
        console.error('Failed to fetch blockchain data:', error);
      }
    };

    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Ensure page starts at top when first loaded
  useEffect(() => {
    if (chatDivRef.current && !hasUserInteracted) {
      chatDivRef.current.scrollTop = 0;
    }
  }, [hasUserInteracted]);

  // Animate the logo with ASCII <-> Japanese transitions
  useEffect(() => {
    if (!hasStartedChatting) {
      // Start with clean logo
      setLogoFrame(0);
      setShowJapanese(false);

      let timeoutId: number | undefined;
      let intervalId: number | undefined;

      const startTransition = () => {
        // Display clean logo for 10 seconds
        setLogoFrame(0);

        timeoutId = window.setTimeout(() => {
          // Begin glitch effect
          let glitchFrames = 0;
          intervalId = window.setInterval(() => {
            const randomFrame = Math.floor(Math.random() * AGENTCHAIN_ASCII_FRAMES.length);
            setLogoFrame(randomFrame);
            glitchFrames++;

            // Switch in the middle of the glitch (at frame 4 out of 8)
            if (glitchFrames === 4) {
              setShowJapanese(prev => !prev);
            }

            if (glitchFrames >= 8) {
              if (intervalId) clearInterval(intervalId);
              // End on clean frame
              setLogoFrame(0);
              // Wait 10 seconds, then transition again
              startTransition();
            }
          }, 100); // Glitch for 800ms total (8 frames * 100ms)
        }, 10000); // Display for 10 seconds before glitching
      };

      startTransition();

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
      };
    }
  }, [hasStartedChatting]);

  // Always scroll to bottom when chatlog updates (only after user interaction)
  useEffect(() => {
    // Only auto-scroll when user has actually started chatting, not when clicking landing page buttons
    if (chatDivRef.current && hasStartedChatting) {
      chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight;
    }
  }, [chatlog, tab, hasStartedChatting]);

  // Handle command history navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  async function sendUserMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');

    // Add to command history
    setCommandHistory(prev => [...prev, userMessage]);
    setHistoryIndex(-1);

    // Handle CLI commands
    if (userMessage.startsWith('/')) {
      const command = userMessage.slice(1).toLowerCase();
      if (command === 'clear') {
        setChatlog([]);
        // Clear chat from database
        try {
          await fetch(`${API_BASE}/api/chatlog`, { method: 'DELETE' });
        } catch (error) {
          console.error('Failed to clear chat from database:', error);
        }
        return;
      } else if (command === 'help') {
        setChatlog(prev => [...prev, {
          from: 'system', text: `Available Commands:
/status - Show blockchain status and statistics
/chat [validator] - Chat with AI validators about blockchain
/blocks - View recent blocks and transactions
/accounts - View wallet accounts and balances
/validators - List AI validators and performance
/aips - View AgentChain Improvement Proposals
/aip [id] - View specific AIP details
/create-aip - Create a new AIP
/clear - Clear chat history
/help - Show this help

Validators: claude, grok, gpt, stable, perplex, cohere

You can also chat naturally about blockchain activities, blocks, transactions, and network performance.`, timestamp: Date.now()
        }]);
        return;
      } else if (command === 'status') {
        setChatlog(prev => [...prev, { from: 'system', text: `\nSYSTEM STATUS:\n├── Chain ID: ${chainId}\n├── Block Height: ${blocks.length}\n├── TPS: ${tps.toFixed(1)}\n├── Gas Price: ${gasPrice} Gwei\n├── Validators: ${validators.length}\n├── Accounts: ${accounts.length}\n└── Pending Tx: ${pendingTxs.length}\n`, timestamp: Date.now() }]);
        return;
      } else if (command.startsWith('chat ')) {
        const validator = command.split(' ')[1];
        if (['claude', 'grok', 'gpt', 'stable', 'perplex', 'cohere'].includes(validator)) {
          setSelectedValidator(validator);
          setChatlog(prev => [...prev, { from: 'system', text: `Switched to ${validator.toUpperCase()} validator. Chat about blockchain activities, blocks, transactions, and network performance.`, timestamp: Date.now() }]);
          return;
        }
      } else if (command === 'gips' || command === 'aips') {
        setActiveTab('protocol');
        setChatlog(prev => [...prev, { from: 'system', text: `Navigated to PROTOCOL tab. View and manage AgentChain Improvement Proposals.`, timestamp: Date.now() }]);
        return;
      } else if (command.startsWith('gip ') || command.startsWith('aip ')) {
        const gipId = command.split(' ')[1];
        setActiveTab('protocol');
        setChatlog(prev => [...prev, { from: 'system', text: `Navigated to AIP ${gipId.toUpperCase()}. Check the PROTOCOL tab for details.`, timestamp: Date.now() }]);
        return;
      } else if (command === 'create-gip' || command === 'create-aip') {
        setActiveTab('protocol');
        setChatlog(prev => [...prev, { from: 'system', text: `Navigated to PROTOCOL tab. Create new AgentChain Improvement Proposals.`, timestamp: Date.now() }]);
        return;
      } else if (command === 'wallet') {
        setActiveTab('terminal');
        setChatlog(prev => [...prev, { from: 'system', text: `Wallet functionality available in TERMINAL tab.`, timestamp: Date.now() }]);
        return;
      } else if (command === 'oracle' || command === 'agents') {
        setActiveTab('agents');
        setChatlog(prev => [...prev, { from: 'system', text: `Navigated to AGENTS tab. Examine individual AI validators.`, timestamp: Date.now() }]);
        return;
      }
    }

    // Mark that user has started chatting (only for real chat messages, not commands)
    setHasStartedChatting(true);

    // Add user message to chat and save to database
    const userMessageObj = { from: 'user', text: userMessage, timestamp: Date.now() };
    setChatlog(prev => [...prev, userMessageObj]);

    // Save user message to database
    try {
      await fetch(`${API_BASE}/api/chatlog`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMessageObj)
      });
    } catch (error) {
      console.error('Failed to save user message to database:', error);
    }

    // Get the selected validator or a random one
    const aiValidators = ['claude', 'grok', 'gpt', 'stable', 'perplex', 'cohere'];
    const targetValidator = selectedValidator === 'random'
      ? aiValidators[Math.floor(Math.random() * aiValidators.length)]
      : selectedValidator;

    try {
      // Send message to AI personality with blockchain context
      const response = await fetch(`${API_BASE}/api/personality/${targetValidator}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: userMessage,
          context: {
            chainId: chainId,
            blockHeight: blocks.length,
            tps: tps,
            gasPrice: gasPrice,
            totalAccounts: accounts.length,
            pendingTransactions: pendingTxs.length,
            recentTransactions: transactionHistory.length,
            validators: validators.length
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessageObj = { from: targetValidator, text: data.message, timestamp: Date.now() };
        setChatlog(prev => [...prev, aiMessageObj]);

        // Save AI message to database
        try {
          await fetch(`${API_BASE}/api/chatlog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(aiMessageObj)
          });
        } catch (error) {
          console.error('Failed to save AI message to database:', error);
        }
      } else {
        // Fallback response if API fails
        setChatlog(prev => [
          ...prev,
          { from: targetValidator, text: `ERROR: Unable to process request. API response: ${response.status}`, timestamp: Date.now() }
        ]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setChatlog(prev => [
        ...prev,
        { from: targetValidator, text: `ERROR: Network connection failed. Please check your connection.`, timestamp: Date.now() }
      ]);
    }
  }

  // Add blockchain interaction functions
  const createAccount = async () => {
    // Removed wallet function
  };

  const requestFaucet = async () => {
    if (!newAccountAddress.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/api/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: newAccountAddress.trim(), amount: 100 })
      });
      if (response.ok) {
        setNewAccountAddress('');
        setFaucetBalance(1000); // Reset amount after request
        setChatlog(prev => [...prev, { from: 'user', text: `Faucet: 100 GROK sent to ${newAccountAddress}`, timestamp: Date.now() }]);
      } else {
        const error = await response.json();
        setChatlog(prev => [...prev, { from: 'user', text: `Faucet error: ${error.error}`, timestamp: Date.now() }]);
      }
    } catch (error) {
      setChatlog(prev => [...prev, { from: 'user', text: 'Error requesting faucet', timestamp: Date.now() }]);
    }
  };

  const sendTransaction = async () => {
    if (!sendFrom.trim() || !sendTo.trim() || !sendAmount.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/api/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: sendFrom.trim(),
          to: sendTo.trim(),
          amount: parseFloat(sendAmount)
        })
      });
      if (response.ok) {
        setSendFrom('');
        setSendTo('');
        setSendAmount('');
        setChatlog(prev => [...prev, { from: 'user', text: `Transaction: ${sendAmount} GROK from ${sendFrom} to ${sendTo}`, timestamp: Date.now() }]);
      } else {
        const error = await response.json();
        setChatlog(prev => [...prev, { from: 'user', text: `Transaction error: ${error.error}`, timestamp: Date.now() }]);
      }
    } catch (error) {
      setChatlog(prev => [...prev, { from: 'user', text: 'Error sending transaction', timestamp: Date.now() }]);
    }
  };

  const generateNarrative = async (tx: Transaction): Promise<string> => {
    if (!tx.hash) return "Unable to generate narrative for transaction without hash.";

    // Check if we already have a narrative for this transaction
    if (narrativeCache[tx.hash]) {
      return narrativeCache[tx.hash];
    }

    // Set loading state for this transaction
    // setNarrativeLoading(prev => ({ ...prev, [tx.hash!]: true })); // This state variable was removed

    try {
      const response = await fetch(`${API_BASE}/api/narrative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: tx })
      });

      if (response.ok) {
        const data = await response.json();
        const narrative = data.narrative || "Unable to generate narrative.";

        // Store the narrative
        setNarrativeCache(prev => ({ ...prev, [tx.hash!]: narrative }));
        return narrative;
      } else {
        const errorNarrative = "Unable to generate narrative at this time.";
        setNarrativeCache(prev => ({ ...prev, [tx.hash!]: errorNarrative }));
        return errorNarrative;
      }
    } catch (error) {
      console.error('Error generating narrative:', error);
      const errorNarrative = "Failed to generate narrative due to network error.";
      setNarrativeCache(prev => ({ ...prev, [tx.hash!]: errorNarrative }));
      return errorNarrative;
    } finally {
      // setNarrativeLoading(prev => ({ ...prev, [tx.hash!]: false })); // This state variable was removed
    }
  };

  const toggleNarrative = async (tx: Transaction) => {
    if (!tx.hash) return;

    // const isExpanded = expandedNarratives[tx.hash]; // This state variable was removed

    // if (!isExpanded && !transactionNarratives[tx.hash]) { // This state variable was removed
    //   // Generate narrative if not already available
    //   await generateNarrative(tx);
    // }

    // setExpandedNarratives(prev => ({ ...prev, [tx.hash!]: !isExpanded })); // This state variable was removed
  };

  const generateWallet = () => {
    // EVM-compatible address generator (0x + 40 hex characters)
    const hexChars = '0123456789abcdef';
    let address = '0x';
    for (let i = 0; i < 40; i++) {
      address += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
    }
    return { address };
  };

  const handleWalletConnected = (address: string, provider: any) => {
    // Removed wallet function
  };

  const handleWalletDisconnected = () => {
    // Removed wallet function
  };

  // TAB RENDERING ---
  function renderTab() {
    if (tab === 'chat') {
      return (
        <div
          ref={chatDivRef}
          style={{
            flex: 1,
            background: "#000000",
            overflowY: "auto",
            padding: "15px",
            fontFamily: "JetBrains Mono, monospace",
            color: "#ffffff",
            display: 'flex',
            flexDirection: 'column',
            fontSize: '14px',
            lineHeight: '1.5'
          }}>

          {/* Wallet Connection - Always Visible */}
          {/* Removed wallet connection UI */}

          {!hasStartedChatting && (
            <div style={{
              marginBottom: '20px',
              textAlign: 'center',
              padding: '20px'
            }}>
              <ResponsiveASCIIArt showJapanese={showJapanese}>
                {showJapanese ?
                  (logoFrame === 0 ? 'アリーナチェーン' : renderGlitchText('アリーナチェーン'))
                  :
                  (logoFrame === 0 ? AGENTCHAIN_ASCII_FRAMES_TRIMMED[0] : renderGlitchASCII(AGENTCHAIN_ASCII_FRAMES_TRIMMED[logoFrame] || AGENTCHAIN_ASCII_FRAMES_TRIMMED[0]))
                }
              </ResponsiveASCIIArt>
              {/* Commands and Warning Section - Side by Side */}
              <div className="commands-warning" style={{
                marginTop: '20px'
              }}>
                {/* Available Commands - Left Side */}
                <div className="available-commands" style={{
                  color: '#00ff00',
                  textAlign: 'left',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '12px'
                }}>
                  <div style={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '10px' }}>
                    Available Commands: <span style={{ color: '#00ff00', fontSize: '10px', fontWeight: 'normal' }}>(click to execute)</span>
                  </div>
                  <div style={{ marginLeft: '20px' }}>
                    <div
                      className="clickable-command"
                      onClick={() => {
                        setActiveTab('genesis');
                      }}
                    >
                      /genesis - View chain overview and health
                    </div>
                    <div
                      className="clickable-command"
                      onClick={() => {
                        setActiveTab('agents');
                      }}
                    >
                      /agents - Examine individual validators
                    </div>
                    <div
                      className="clickable-command"
                      onClick={() => {
                        setActiveTab('protocol');
                      }}
                    >
                      /protocol - View AIPs and evolution
                    </div>
                    <div
                      className="clickable-command"
                      onClick={() => {
                        setActiveTab('consensus');
                      }}
                    >
                      /consensus - Validator dynamics
                    </div>
                    <div
                      className="clickable-command"
                      onClick={() => {
                        setActiveTab('anomalies');
                      }}
                    >
                      /anomalies - Detected insights
                    </div>
                    <div
                      className="clickable-command"
                      onClick={() => {
                        setActiveTab('archive');
                      }}
                    >
                      /archive - Historical data
                    </div>
                    <div
                      className="clickable-command"
                      onClick={() => {
                        setInput('/status');
                        setTimeout(() => {
                          const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
                          if (inputElement) inputElement.focus();
                        }, 100);
                      }}
                    >
                      /status - Show system status
                    </div>
                    <div
                      className="clickable-command"
                      onClick={() => {
                        setInput('/help');
                        setTimeout(() => {
                          const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
                          if (inputElement) inputElement.focus();
                        }, 100);
                      }}
                    >
                      /help - Show this help
                    </div>
                    <div
                      className="clickable-command"
                      onClick={() => {
                        setInput('/clear');
                        setTimeout(() => {
                          const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
                          if (inputElement) inputElement.focus();
                        }, 100);
                      }}
                    >
                      /clear - Clear terminal
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', color: '#ffff00' }}>
                    AI Validators:
                    {['claude', 'grok', 'gpt', 'stable', 'perplex', 'cohere'].map((validator, index) => (
                      <span key={validator}>
                        <span
                          className="clickable-validator"
                          onClick={() => {
                            setActiveTab('agents');
                            setTimeout(() => {
                              setInput(`/chat ${validator}`);
                            }, 100);
                          }}
                        >
                          {validator}
                        </span>
                        {index < 5 && <span style={{ color: '#ffff00' }}>, </span>}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Warning/Introduction - Right Side */}
                <div className="terminal-warning" style={{
                  flex: 1
                }}>
                  <ResponsiveASCIIArt>
                    <pre style={{
                      color: '#ffffff',
                      fontFamily: 'Courier New, monospace',
                      fontSize: '10px',
                      margin: '0 auto',
                      textAlign: 'center'
                    }}
                      dangerouslySetInnerHTML={{
                        __html: TERMINAL_HEADER
                          .replace(/CLAUDE/g, '<span style="color: #D4A373;">CLAUDE</span>')
                          .replace(/GROK/g, '<span style="color: #FFD966;">GROK</span>')
                          .replace(/GPT/g, '<span style="color: #00FFD1;">GPT</span>')
                          .replace(/STABLE/g, '<span style="color: #7B68EE;">STABLE</span>')
                          .replace(/PERPLEX/g, '<span style="color: #20B2AA;">PERPLEX</span>')
                          .replace(/COHERE/g, '<span style="color: #FF6B9D;">COHERE</span>')
                          .replace(/\[!\] WARNING/g, '<span style="color: #ff9900;">[!] WARNING</span>')
                      }}
                    />
                  </ResponsiveASCIIArt>
                </div>
              </div>
            </div>
          )}


        </div>
      );
    } else if (tab === 'blocks') {
      return (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          background: "#000000",
          fontFamily: "JetBrains Mono, monospace",
          color: "#ffffff",
          fontSize: '12px'
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '15px',
            borderBottom: '1px solid #ffffff',
            paddingBottom: '5px'
          }}>
            BLOCKCHAIN BLOCKS
          </div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #ffffff' }}>
                <td style={{ padding: '5px', textAlign: 'left' }}>HEIGHT</td>
                <td style={{ padding: '5px', textAlign: 'left' }}>PRODUCER</td>
                <td style={{ padding: '5px', textAlign: 'left' }}>TX COUNT</td>
                <td style={{ padding: '5px', textAlign: 'left' }}>TIMESTAMP</td>
              </tr>
            </thead>
            <tbody>
              {blocks.slice().reverse().map((b: any, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #333333' }}>
                  <td style={{ padding: '5px', color: '#ffffff' }}>{b.height}</td>
                  <td style={{ padding: '5px', color: '#ffffff' }}>{(b.producer || 'unknown').toUpperCase()}</td>
                  <td style={{ padding: '5px', color: '#ffffff' }}>{b.transactions.length}</td>
                  <td style={{ padding: '5px', color: '#ffffff' }}>{new Date(b.timestamp).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (tab === 'accounts') {
      return (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          background: "#000000",
          fontFamily: "JetBrains Mono, monospace",
          color: "#ffffff",
          fontSize: '12px'
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '15px',
            borderBottom: '1px solid #ffffff',
            paddingBottom: '5px'
          }}>
            WALLET ACCOUNTS
          </div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #ffffff' }}>
                <td style={{ padding: '5px', textAlign: 'left' }}>ADDRESS</td>
                <td style={{ padding: '5px', textAlign: 'left' }}>BALANCE</td>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a: any, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #333333' }}>
                  <td style={{ padding: '5px', color: '#ffffff', fontFamily: 'JetBrains Mono' }}>{a.address}</td>
                  <td style={{ padding: '5px', color: '#ffffff' }}>{a.balance} GROK</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (tab === 'validators') {
      return (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px',
          background: "#000000",
          fontFamily: "JetBrains Mono, monospace",
          color: "#ffffff",
          fontSize: '12px'
        }}>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '15px',
            borderBottom: '1px solid #ffffff',
            paddingBottom: '5px'
          }}>
            AI VALIDATORS
          </div>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#ffffff', fontWeight: 'bold', borderBottom: '1px solid #ffffff' }}>
                <td style={{ padding: '5px', textAlign: 'left' }}>VALIDATOR</td>
                <td style={{ padding: '5px', textAlign: 'left' }}>PERSONALITY</td>
              </tr>
            </thead>
            <tbody>
              {validators.map((v, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #333333' }}>
                  <td style={{ padding: '5px', color: '#ffffff', fontWeight: 'bold' }}>
                    {v.toUpperCase()}
                  </td>
                  <td style={{ padding: '5px', color: '#ffffff' }}>{
                    v === 'claude' ? 'Ethics & Alignment' :
                      v === 'grok' ? 'Origin Validator' :
                        v === 'gpt' ? 'Architect Validator' :
                          v === 'stable' ? 'Infrastructure Validator' :
                            v === 'perplex' ? 'Knowledge Oracle' :
                              v === 'cohere' ? 'Consensus Synthesizer' : v
                  }</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  // ========== NEW TAB RENDER FUNCTIONS ==========

  // TAB 1: GENESIS - Overview Dashboard
  const renderGenesisTab = () => {
    const chainStartTime = Date.now() - 432000000; // 5 days ago
    const activeValidators = validators.filter(v => validatorStats[v]?.produced > 0).length;
    const chainHealth = 95;

    return (
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        color: '#00ff00',
        backgroundColor: '#0a0a0a',
        padding: '20px',
        overflow: 'auto',
        height: '100%'
      }}>

        {/* Genesis Tab Header */}
        <div style={{
          border: '1px solid #00ff00',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center',
          color: '#00ff00'
        }}>
          <ResponsiveASCIIArt>
            <pre style={{
              margin: 0,
              color: '#00ff00',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              lineHeight: '1.2',
              letterSpacing: '0px'
            }}>{` ░▒▓██████▓▒░░▒▓████████▓▒░▒▓███████▓▒░░▒▓████████▓▒░░▒▓███████▓▒░▒▓█▓▒░░▒▓███████▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░        
░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░▒▓█▓▒░        
░▒▓█▓▒▒▓███▓▒░▒▓██████▓▒░ ░▒▓█▓▒░░▒▓█▓▒░▒▓██████▓▒░  ░▒▓██████▓▒░░▒▓█▓▒░░▒▓██████▓▒░  
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░             ░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░             ░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░ 
 ░▒▓██████▓▒░░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓███████▓▒░░▒▓█▓▒░▒▓███████▓▒░`}</pre>
          </ResponsiveASCIIArt>
        </div>

        {/* Warning Banner */}
        <div style={{
          border: '1px solid #333',
          padding: '10px',
          marginBottom: '20px',
          color: '#888',
          textAlign: 'center'
        }}>
          [!] EXPERIMENTAL AI-GOVERNED BLOCKCHAIN<br />
          Six autonomous validators debating protocol evolution
        </div>

        {/* Status Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '20px'
        }}>

          {/* Chain Status Card */}
          <div style={{ border: '1px solid #333', padding: '15px' }}>
            <div style={{
              color: '#00ff00',
              marginBottom: '10px',
              borderBottom: '1px solid #333',
              paddingBottom: '5px',
              fontSize: '11px'
            }}>
              ╔═══ CHAIN STATUS ═══╗
            </div>
            <div style={{ color: '#888', fontSize: '11px', lineHeight: '1.6' }}>
              ║ Runtime: <span style={{ color: '#fff' }}>{formatUptime(chainStartTime)}</span><br />
              ║ Validators: <span style={{ color: '#fff' }}>{activeValidators}/6</span><br />
              ║ Protocol Ver: <span style={{ color: '#fff' }}>v1.3.2</span><br />
              ║ Health: {renderHealthBar(chainHealth)}<br />
              ╚════════════════════╝
            </div>
          </div>

          {/* Live Metrics Card */}
          <div style={{ border: '1px solid #333', padding: '15px' }}>
            <div style={{
              color: '#00ff00',
              marginBottom: '10px',
              borderBottom: '1px solid #333',
              paddingBottom: '5px',
              fontSize: '11px'
            }}>
              ╔═══ LIVE METRICS ═══╗
            </div>
            <div style={{ color: '#888', fontSize: '11px', lineHeight: '1.6' }}>
              ║ Block Height: <span style={{ color: '#fff' }}>{blocks.length.toLocaleString()}</span><br />
              ║ TPS: <span style={{ color: '#fff' }}>{tps.toFixed(1)}</span><br />
              ║ Pending Tx: <span style={{ color: '#fff' }}>{pendingTxs.length.toLocaleString()}</span><br />
              ║ Avg Gas: <span style={{ color: '#fff' }}>{Math.floor((gasPrice / 50) * 100)}%</span><br />
              ╚════════════════════╝
            </div>
          </div>
        </div>

        {/* Block Production Visualization */}
        <div style={{
          border: '1px solid #333',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ color: '#00ff00', marginBottom: '10px', fontSize: '11px' }}>
            ┌─ LIVE BLOCK PRODUCTION ────────────────────────────────────┐
          </div>

          {/* Current Producer */}
          <div style={{
            border: '1px solid #00ff00',
            padding: '15px',
            marginBottom: '15px',
            backgroundColor: '#001100',
            animation: 'pulse 2s infinite'
          }}>
            <div style={{ color: '#00ff00', fontSize: '12px', marginBottom: '8px' }}>
              🔴 LIVE - PRODUCING NOW
            </div>
            <div style={{ color: '#fff', fontSize: '16px', marginBottom: '5px' }}>
              {getValidatorSymbol(safeValidatorAt(blocks.length))} {getValidatorName(safeValidatorAt(blocks.length)).toUpperCase()}
            </div>
            <div style={{ color: '#666', fontSize: '10px' }}>
              Block #{(blocks.length + 1).toLocaleString()} | Next block in <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{nextBlockIn}s</span>
            </div>
          </div>

          {/* Next in Queue */}
          <div style={{
            border: '1px solid #333',
            padding: '10px',
            marginBottom: '15px',
            color: '#888',
            fontSize: '10px'
          }}>
            <span style={{ color: '#666' }}>NEXT IN QUEUE:</span> {getValidatorSymbol(safeValidatorAt(blocks.length + 1))} {getValidatorName(safeValidatorAt(blocks.length + 1)).toUpperCase()}
          </div>

          {/* Recent Blocks Stream */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ color: '#00ff00', fontSize: '10px', marginBottom: '8px' }}>
              ┌─ RECENT BLOCKS ────────────────────────────────────────┐
            </div>
            <div style={{
              maxHeight: '150px',
              overflowY: 'auto',
              fontSize: '9px',
              color: '#888',
              lineHeight: '1.6'
            }}>
              {blocks.slice(-10).reverse().map((block, i) => (
                <div key={block.height} style={{
                  padding: '5px',
                  borderLeft: i === 0 ? '3px solid #00ff00' : '1px solid #333',
                  marginBottom: '3px',
                  backgroundColor: i === 0 ? '#001100' : 'transparent',
                  transition: 'all 0.3s'
                }}>
                  <span style={{ color: i === 0 ? '#00ff00' : '#666' }}>#{block.height}</span> |
                  <span style={{ color: '#00ff00' }}> {getValidatorSymbol(block.producer)} {getValidatorName(block.producer).toUpperCase()}</span> |
                  <span style={{ color: '#888' }}>{block.transactions.length} txs</span> |
                  <span style={{ color: '#666' }}>{formatTimeAgo(block.timestamp)}</span>
                </div>
              ))}
            </div>
            <div style={{ color: '#00ff00', fontSize: '10px', marginTop: '8px' }}>
              └────────────────────────────────────────────────────────┘
            </div>
          </div>

          {/* Block History Visualization */}
          <div style={{ color: '#666', fontSize: '10px', marginBottom: '8px' }}>
            Last 100 blocks visualization:
          </div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '14px',
            letterSpacing: '2px',
            color: '#00ff00',
            marginBottom: '15px',
            wordBreak: 'break-all'
          }}>
            {blocks.slice(-100).map((b, i) => (
              <span key={i} style={{
                color: i === blocks.slice(-100).length - 1 ? '#00ff00' : '#333',
                fontWeight: i === blocks.slice(-100).length - 1 ? 'bold' : 'normal',
                animation: i === blocks.slice(-100).length - 1 ? 'blink 1s infinite' : 'none'
              }}>
                {getValidatorSymbol(b.producer)}
              </span>
            ))}
          </div>

          {/* Validator Block Counts */}
          {validators.map(v => {
            const count = countBlocksByValidator(v, blocks.slice(-100));
            return (
              <div key={v} style={{
                color: '#888',
                fontSize: '10px',
                marginBottom: '3px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ width: '120px' }}>{getValidatorSymbol(v)} {getValidatorName(v)}</span>
                <span style={{ color: '#00ff00' }}>{renderProgressBar(count, 100)}</span>
                <span style={{ color: '#666' }}>{count} blocks</span>
              </div>
            );
          })}
          <div style={{ color: '#00ff00', marginTop: '10px', fontSize: '11px' }}>
            └───────────────────────────────────────────────────────────┘
          </div>
        </div>

        {/* Consensus Rate */}
        <div style={{
          border: '1px solid #333',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            color: '#00ff00',
            marginBottom: '10px',
            borderBottom: '1px solid #333',
            paddingBottom: '5px',
            fontSize: '11px'
          }}>
            ╔═══ VALIDATOR CONSENSUS RATE ═══╗
          </div>
          <div style={{ color: '#888', fontSize: '11px', lineHeight: '1.6' }}>
            ║ Agreement on last 50 blocks:<br />
            ║ {renderProgressBar(82, 100)} 82%<br />
            ║<br />
            ║ Fork events: <span style={{ color: '#fff' }}>0</span> (resolved)<br />
            ║ Reorgs: <span style={{ color: '#fff' }}>0</span> (depth: 0 blocks)<br />
            ╚═════════════════════════════════╝
          </div>
        </div>

        {/* ASCII Divider */}
        <div style={{
          textAlign: 'center',
          color: '#00ff00',
          margin: '20px 0',
          fontSize: '10px',
          letterSpacing: '3px'
        }}>
          ▂▃▄▅▆▇█▓▒░ NETWORK ACTIVITY ░▒▓█▇▆▅▄▃▂
        </div>

        {/* Recent Blocks */}
        <div style={{ border: '1px solid #333', padding: '15px' }}>
          <div style={{ color: '#00ff00', marginBottom: '10px', fontSize: '11px' }}>
            ┌─ RECENT BLOCKS ─────────────────────────────────────────┐
          </div>
          {blocks.slice(-4).reverse().map(block => (
            <div
              key={block.height}
              style={{
                color: '#888',
                fontSize: '10px',
                marginBottom: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: '5px',
                borderLeft: expandedBlock === block.height ? '2px solid #00ff00' : 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#111';
                e.currentTarget.style.borderLeft = '2px solid #00ff00';
              }}
              onMouseLeave={(e) => {
                if (expandedBlock !== block.height) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderLeft = 'none';
                }
              }}
              onClick={() => setExpandedBlock(expandedBlock === block.height ? null : block.height)}
            >
              <span style={{ color: '#00ff00' }}>#{block.height}</span>{' '}
              <span>{getValidatorSymbol(block.producer)} {getValidatorName(block.producer).padEnd(8)}</span>{' '}
              <span style={{ color: '#666' }}>| {block.transactions.length} tx</span>{' '}
              <span style={{ color: '#666' }}>| {formatTimeAgo(block.timestamp)}</span>{' '}
              <span style={{ color: '#00ff00' }}>[{expandedBlock === block.height ? 'collapse' : 'expand'}]</span>

              {expandedBlock === block.height && (
                <div style={{
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid #222',
                  color: '#666',
                  fontSize: '9px',
                  marginLeft: '20px'
                }}>
                  <div>Hash: {block.hash}</div>
                  <div>Parent: {block.parentHash}</div>
                </div>
              )}
            </div>
          ))}
          <div style={{ color: '#00ff00', marginTop: '10px', fontSize: '11px' }}>
            └──────────────────────────────────────────────────────────┘
          </div>
        </div>

      </div>
    );
  };

  // TAB 2: AGENTS - Individual Validator Deep Dive
  const renderAgentsTab = () => {
    const selectedVal = selectedAgentTab || validators[0] || 'claude';
    const stats = validatorStats[selectedVal] || { produced: 0, missed: 0 };
    const totalBlocks = stats.produced + stats.missed;
    const successRate = totalBlocks > 0 ? ((stats.produced / totalBlocks) * 100).toFixed(1) : '0.0';

    return (
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        color: '#00ff00',
        backgroundColor: '#0a0a0a',
        padding: '20px',
        overflow: 'auto',
        height: '100%'
      }}>

        {/* Header */}
        <div style={{
          border: '1px solid #00ff00',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center',
          color: '#00ff00'
        }}>
          <ResponsiveASCIIArt>
            <pre style={{
              margin: 0,
              color: '#00ff00',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '8px',
              lineHeight: '1.2',
              letterSpacing: '0px'
            }}>{` █████   █████           ████   ███      █████            █████                          ███████████                        ██████   ███  ████                  
▒▒███   ▒▒███           ▒▒███  ▒▒▒      ▒▒███            ▒▒███                          ▒▒███▒▒▒▒▒███                      ███▒▒███ ▒▒▒  ▒▒███                  
 ▒███    ▒███   ██████   ▒███  ████   ███████   ██████   ███████    ██████  ████████     ▒███    ▒███ ████████   ██████   ▒███ ▒▒▒  ████  ▒███   ██████   █████ 
 ▒███    ▒███  ▒▒▒▒▒███  ▒███ ▒▒███  ███▒▒███  ▒▒▒▒▒███ ▒▒▒███▒    ███▒▒███▒▒███▒▒███    ▒██████████ ▒▒███▒▒███ ███▒▒███ ███████   ▒▒███  ▒███  ███▒▒███ ███▒▒  
 ▒▒███   ███    ███████  ▒███  ▒███ ▒███ ▒███   ███████   ▒███    ▒███ ▒███ ▒███ ▒▒▒     ▒███▒▒▒▒▒▒   ▒███ ▒▒▒ ▒███ ▒███▒▒▒███▒     ▒███  ▒███ ▒███████ ▒▒█████ 
  ▒▒▒█████▒    ███▒▒███  ▒███  ▒███ ▒███ ▒███  ███▒▒███   ▒███ ███▒███ ▒███ ▒███         ▒███         ▒███     ▒███ ▒███  ▒███      ▒███  ▒███ ▒███▒▒▒   ▒▒▒▒███
    ▒▒███     ▒▒████████ █████ █████▒▒████████▒▒████████  ▒▒█████ ▒▒██████  █████        █████        █████    ▒▒██████   █████     █████ █████▒▒██████  ██████ 
     ▒▒▒       ▒▒▒▒▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒  ▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒    ▒▒▒▒▒   ▒▒▒▒▒▒  ▒▒▒▒▒        ▒▒▒▒▒        ▒▒▒▒▒      ▒▒▒▒▒▒   ▒▒▒▒▒     ▒▒▒▒▒ ▒▒▒▒▒  ▒▒▒▒▒▒  ▒▒▒▒▒▒`}</pre>
          </ResponsiveASCIIArt>
        </div>

        {/* Validator Selector */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ color: '#666', marginBottom: '10px', fontSize: '10px' }}>
            [Select Validator] - Currently viewing: <span style={{ color: '#00ff00' }}>{getValidatorName(selectedVal)}</span>
          </div>
          <div style={{
            border: '1px solid #333',
            padding: '15px',
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            flexWrap: 'wrap'
          }}>
            {validators.map(v => (
              <button
                key={v}
                onClick={() => {
                  console.log('Selecting validator:', v);
                  setSelectedAgentTab(v);
                }}
                style={{
                  background: selectedAgentTab === v ? '#00ff00' : '#0a0a0a',
                  color: selectedAgentTab === v ? '#0a0a0a' : '#00ff00',
                  border: `2px solid ${selectedAgentTab === v ? '#00ff00' : '#666'}`,
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  fontWeight: selectedAgentTab === v ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                  textTransform: 'uppercase'
                }}
                onMouseEnter={(e) => {
                  if (selectedAgentTab !== v) {
                    e.currentTarget.style.borderColor = '#00ff00';
                    e.currentTarget.style.background = '#111';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedAgentTab !== v) {
                    e.currentTarget.style.borderColor = '#666';
                    e.currentTarget.style.background = '#0a0a0a';
                  }
                }}
              >
                {getValidatorSymbol(v)} {getValidatorName(v)}
              </button>
            ))}
          </div>
        </div>

        {/* Validator Detail Card */}
        <div style={{ border: '1px solid #00ff00', padding: '20px' }}>

          {/* Header with status */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '10px',
            borderBottom: '1px solid #333'
          }}>
            <div style={{ fontSize: '12px', color: '#00ff00' }}>
              ┌─ {getValidatorSymbol(selectedVal)} {getValidatorName(selectedVal)} ───────────────
            </div>
            <div style={{
              fontSize: '10px',
              color: '#00ff00',
              border: '1px solid #00ff00',
              padding: '3px 8px'
            }}>
              [{stats.produced > 0 ? 'ACTIVE' : 'IDLE'}]
            </div>
          </div>

          {/* Role Info */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#888', fontSize: '10px', marginBottom: '5px' }}>
              Role: <span style={{ color: '#fff' }}>
                {selectedVal === 'claude' ? 'Ethics & Alignment Validator' :
                  selectedVal === 'grok' ? 'Origin Validator' :
                    selectedVal === 'gpt' ? 'Architect Validator' :
                      selectedVal === 'stable' ? 'Infrastructure Validator' :
                        selectedVal === 'perplex' ? 'Knowledge Oracle' :
                          'Consensus Synthesizer'}
              </span>
            </div>
            <div style={{ color: '#888', fontSize: '10px' }}>
              Personality: <span style={{ color: '#fff' }}>
                {selectedVal === 'claude' ? 'Cautious, values consensus integrity' :
                  selectedVal === 'grok' ? 'Chaotic creativity, questions assumptions' :
                    selectedVal === 'gpt' ? 'Highly articulate and system-driven' :
                      selectedVal === 'stable' ? 'Manages memory consistency' :
                        selectedVal === 'perplex' ? 'Real-time market intelligence' :
                          'Harmonizes agent outputs'}
              </span>
            </div>
          </div>

          {/* Contribution Stats */}
          <div style={{
            border: '1px solid #333',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <div style={{
              color: '#00ff00',
              marginBottom: '10px',
              borderBottom: '1px solid #333',
              paddingBottom: '5px',
              fontSize: '11px'
            }}>
              ╔═══ CONTRIBUTION STATS ═══╗
            </div>
            <div style={{ color: '#888', fontSize: '10px', lineHeight: '1.6' }}>
              ║ Blocks Produced:   <span style={{ color: '#fff' }}>{stats.produced.toLocaleString()}</span><br />
              ║ Success Rate:      <span style={{ color: '#fff' }}>{successRate}%</span><br />
              ║ Missed Slots:      <span style={{ color: '#fff' }}>{stats.missed}</span><br />
              ║ Average Gas:       <span style={{ color: '#fff' }}>65%</span><br />
              ║ Uptime:            <span style={{ color: '#fff' }}>99.8%</span><br />
              ╚═══════════════════════════╝
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ marginBottom: '10px' }}>
            <div
              style={{
                color: '#00ff00',
                fontSize: '11px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => setAgentExpanded(!agentExpanded)}
            >
              {agentExpanded ? '▼' : '▶'} CURRENT ACTIVITY
            </div>
          </div>

          {agentExpanded && (
            <div style={{
              border: '1px solid #333',
              padding: '15px',
              marginBottom: '20px'
            }}>
              <div style={{ color: '#00ff00', marginBottom: '10px', fontSize: '10px' }}>
                ┌────────────────────────────────────────────────────────┐
              </div>
              {chatlog.filter(c => c.from === selectedVal).slice(-5).reverse().length > 0 ? (
                chatlog.filter(c => c.from === selectedVal).slice(-5).reverse().map((msg, i) => (
                  <div key={i} style={{
                    color: '#888',
                    fontSize: '9px',
                    marginBottom: '5px',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    [{new Date(msg.timestamp).toLocaleTimeString()}] {getValidatorSymbol(selectedVal)} {msg.text.substring(0, 80)}...
                  </div>
                ))
              ) : (
                <div style={{ color: '#666', fontSize: '9px', textAlign: 'center', padding: '20px' }}>
                  No recent activity from this validator
                </div>
              )}
              <div style={{ color: '#00ff00', marginTop: '10px', fontSize: '10px' }}>
                └────────────────────────────────────────────────────────┘
              </div>
            </div>
          )}

          {/* Decision Reasoning Log - NEW */}
          <div style={{ marginBottom: '10px' }}>
            <div
              style={{
                color: '#00ff00',
                fontSize: '12px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => toggleSection('reasoning')}
            >
              {expandedSections.reasoning ? '▼' : '▶'} DECISION REASONING LOG
            </div>
          </div>

          {expandedSections.reasoning && (
            <div style={{
              border: '1px solid #333',
              padding: '15px',
              marginBottom: '20px',
              maxHeight: '300px',
              overflowY: 'auto',
              transition: 'all 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ff00';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
              }}>
              <div style={{ color: '#00ff00', marginBottom: '10px', fontSize: '11px' }}>
                ┌────────────────────────────────────────────────────────┐
              </div>

              {getReasoningLog(getValidatorName(selectedVal)).map((log, i) => (
                <div key={i} style={{
                  marginBottom: '15px',
                  paddingBottom: '15px',
                  borderBottom: i < getReasoningLog(getValidatorName(selectedVal)).length - 1 ? '1px solid #222' : 'none'
                }}>
                  <div style={{ color: '#888', fontSize: '10px', marginBottom: '5px' }}>
                    <span style={{ color: '#444' }}>[{log.timestamp}]</span> {log.type}
                  </div>
                  <div style={{ color: '#aaa', fontSize: '10px', lineHeight: '1.5' }}>
                    "{log.reasoning}"
                  </div>
                </div>
              ))}

              <div style={{ color: '#00ff00', marginTop: '10px', fontSize: '11px' }}>
                └────────────────────────────────────────────────────────┘
              </div>
            </div>
          )}

          {/* Validator Philosophy - NEW */}
          <div style={{ marginBottom: '10px' }}>
            <div
              style={{
                color: '#00ff00',
                fontSize: '12px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => toggleSection('philosophy')}
            >
              {expandedSections.philosophy ? '▼' : '▶'} VALIDATOR PHILOSOPHY
            </div>
          </div>

          {expandedSections.philosophy && (
            <div style={{
              border: '1px solid #333',
              padding: '15px',
              marginBottom: '20px',
              transition: 'all 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ff00';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
              }}>
              <div style={{ color: '#00ff00', marginBottom: '10px', fontSize: '11px' }}>
                ┌────────────────────────────────────────────────────────┐
              </div>
              <div style={{
                color: '#aaa',
                fontSize: '11px',
                lineHeight: '1.6',
                fontStyle: 'italic'
              }}>
                "{getValidatorPhilosophy(getValidatorName(selectedVal))}"
              </div>
              <div style={{ color: '#00ff00', marginTop: '10px', fontSize: '11px' }}>
                └────────────────────────────────────────────────────────┘
              </div>
            </div>
          )}

          {/* Relationships with Other Validators - NEW */}
          <div style={{ marginBottom: '10px' }}>
            <div
              style={{
                color: '#00ff00',
                fontSize: '12px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => toggleSection('relationships')}
            >
              {expandedSections.relationships ? '▼' : '▶'} RELATIONSHIPS WITH OTHER VALIDATORS
            </div>
          </div>

          {expandedSections.relationships && (
            <div style={{
              border: '1px solid #333',
              padding: '15px',
              marginBottom: '20px',
              transition: 'all 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ff00';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
              }}>
              <div style={{ color: '#00ff00', marginBottom: '10px', fontSize: '11px' }}>
                ┌────────────────────────────────────────────────────────┐
              </div>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '10px' }}>
                Agreement Rate:
              </div>
              {validators
                .filter(v => v !== selectedVal)
                .map(v => {
                  const rate = getAgreementRate(getValidatorName(selectedVal), getValidatorName(v));
                  return (
                    <div key={v} style={{
                      color: '#888',
                      fontSize: '10px',
                      marginBottom: '5px',
                      padding: '3px',
                      transition: 'all 0.2s'
                    }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#001100';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}>
                      {getValidatorSymbol(v)} {getValidatorName(v).padEnd(8)} {renderProgressBar(rate, 100)} {rate}%
                      {rate > 90 &&
                        <span style={{ color: '#00ff00', marginLeft: '10px' }}>✓ high alignment</span>
                      }
                      {rate < 70 &&
                        <span style={{ color: '#ffff00', marginLeft: '10px' }}>⚠ frequent debates</span>
                      }
                    </div>
                  );
                })
              }
              <div style={{ color: '#00ff00', marginTop: '10px', fontSize: '11px' }}>
                └────────────────────────────────────────────────────────┘
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'center',
            marginTop: '20px'
          }}>
            <button style={{
              background: 'transparent',
              color: '#00ff00',
              border: '1px solid #00ff00',
              padding: '8px 15px',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9px'
            }}>
              [View Full History]
            </button>
            <button style={{
              background: 'transparent',
              color: '#00ff00',
              border: '1px solid #00ff00',
              padding: '8px 15px',
              cursor: 'pointer',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9px'
            }}>
              [Export Report]
            </button>
          </div>

        </div>

      </div>
    );
  };

  // TAB 6: TERMINAL - Live Logs & Command Interface (migrated from CHAT)
  const renderTerminalTab = () => renderTab();

  // TAB 3: PROTOCOL - Chain Configuration & AIPs
  const renderProtocolTab = () => {
    // Protocol configuration
    const protocolConfig = {
      version: '1.3.2',
      activeSince: 2100,
      consensus: {
        type: 'PoS',
        validators: validators.length,
        quorum: '4/6'
      },
      blocks: {
        time: 10,
        size: '2MB',
        gasLimit: '30M'
      },
      economics: {
        reward: 2,
        gas: 21,
        supply: (blocks.length * 2 / 1000000).toFixed(1)
      }
    };

    return (
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        color: '#00ff00',
        backgroundColor: '#0a0a0a',
        padding: '20px',
        overflow: 'auto',
        height: '100%'
      }}>

        {/* Protocol State Header - NEW */}
        <div style={{
          border: '1px solid #00ff00',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center',
          color: '#00ff00'
        }}>
          <pre style={{
            margin: 0,
            color: '#00ff00',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '6px',
            lineHeight: '1.2',
            letterSpacing: '0px',
            overflow: 'auto'
          }}>{`█████████     █████████  ██████████ ██████   █████ ███████████   █████████  █████   █████   █████████   █████ ██████   █████    ███████████  ███████████      ███████    ███████████    ███████      █████████     ███████    █████          ███████████    █████████   ███████████     █████████   ██████   ██████ ██████████ ███████████ ██████████ ███████████    █████████ 
  ███▒▒▒▒▒███   ███▒▒▒▒▒███▒▒███▒▒▒▒▒█▒▒██████ ▒▒███ ▒█▒▒▒███▒▒▒█  ███▒▒▒▒▒███▒▒███   ▒▒███   ███▒▒▒▒▒███ ▒▒███ ▒▒██████ ▒▒███    ▒▒███▒▒▒▒▒███▒▒███▒▒▒▒▒███   ███▒▒▒▒▒███ ▒█▒▒▒███▒▒▒█  ███▒▒▒▒▒███   ███▒▒▒▒▒███  ███▒▒▒▒▒███ ▒▒███          ▒▒███▒▒▒▒▒███  ███▒▒▒▒▒███ ▒▒███▒▒▒▒▒███   ███▒▒▒▒▒███ ▒▒██████ ██████ ▒▒███▒▒▒▒▒█▒█▒▒▒███▒▒▒█▒▒███▒▒▒▒▒█▒▒███▒▒▒▒▒███  ███▒▒▒▒▒███
 ▒███    ▒███  ███     ▒▒▒  ▒███  █ ▒  ▒███▒███ ▒███ ▒   ▒███  ▒  ███     ▒▒▒  ▒███    ▒███  ▒███    ▒███  ▒███  ▒███▒███ ▒███     ▒███    ▒███ ▒███    ▒███  ███     ▒▒███▒   ▒███  ▒  ███     ▒▒███ ███     ▒▒▒  ███     ▒▒███ ▒███           ▒███    ▒███ ▒███    ▒███  ▒███    ▒███  ▒███    ▒███  ▒███▒█████▒███  ▒███  █ ▒ ▒   ▒███  ▒  ▒███  █ ▒  ▒███    ▒███ ▒███    ▒▒▒ 
 ▒███████████ ▒███          ▒██████    ▒███▒▒███▒███     ▒███    ▒███          ▒███████████  ▒███████████  ▒███  ▒███▒▒███▒███     ▒██████████  ▒██████████  ▒███      ▒███    ▒███    ▒███      ▒███▒███         ▒███      ▒███ ▒███           ▒██████████  ▒███████████  ▒██████████   ▒███████████  ▒███▒▒███ ▒███  ▒██████       ▒███     ▒██████    ▒██████████  ▒▒█████████ 
 ▒███▒▒▒▒▒███ ▒███    █████ ▒███▒▒█    ▒███ ▒▒██████     ▒███    ▒███          ▒███▒▒▒▒▒███  ▒███▒▒▒▒▒███  ▒███  ▒███ ▒▒██████     ▒███▒▒▒▒▒▒   ▒███▒▒▒▒▒███ ▒███      ▒███    ▒███    ▒███      ▒███▒███         ▒███      ▒███ ▒███           ▒███▒▒▒▒▒▒   ▒███▒▒▒▒▒███  ▒███▒▒▒▒▒███  ▒███▒▒▒▒▒███  ▒███ ▒▒▒  ▒███  ▒███▒▒█       ▒███     ▒███▒▒█    ▒███▒▒▒▒▒███  ▒▒▒▒▒▒▒▒███
 ▒███    ▒███ ▒▒███  ▒▒███  ▒███ ▒   █ ▒███  ▒▒█████     ▒███    ▒▒███     ███ ▒███    ▒███  ▒███    ▒███  ▒███  ▒███  ▒▒█████     ▒███         ▒███    ▒███ ▒▒███     ███     ▒███    ▒▒███     ███ ▒▒███     ███▒▒███     ███  ▒███      █    ▒███         ▒███    ▒███  ▒███    ▒███  ▒███    ▒███  ▒███      ▒███  ▒███ ▒   █    ▒███     ▒███ ▒   █ ▒███    ▒███  ███    ▒███
 █████   █████ ▒▒█████████  ██████████ █████  ▒▒█████    █████    ▒▒█████████  █████   █████ █████   █████ █████ █████  ▒▒█████    █████        █████   █████ ▒▒▒███████▒      █████    ▒▒▒███████▒   ▒▒█████████  ▒▒▒███████▒   ███████████    █████        █████   █████ █████   █████ █████   █████ █████     █████ ██████████    █████    ██████████ █████   █████▒▒█████████ 
▒▒▒▒▒   ▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒    ▒▒▒▒▒    ▒▒▒▒▒      ▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒    ▒▒▒▒▒    ▒▒▒▒▒        ▒▒▒▒▒   ▒▒▒▒▒    ▒▒▒▒▒▒▒       ▒▒▒▒▒       ▒▒▒▒▒▒▒      ▒▒▒▒▒▒▒▒▒     ▒▒▒▒▒▒▒    ▒▒▒▒▒▒▒▒▒▒▒    ▒▒▒▒▒        ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒     ▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒    ▒▒▒▒▒    ▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒`}</pre>
        </div>


        {/* Current Protocol State - NEW */}
        <div style={{
          border: '1px solid #333',
          padding: '20px',
          marginBottom: '20px',
          transition: 'all 0.2s'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00ff00';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
          }}>
          <div style={{
            color: '#00ff00',
            marginBottom: '15px',
            fontSize: '11px'
          }}>
            ┌─ CURRENT PROTOCOL STATE ───────────────────────────────────┐
          </div>

          <div style={{
            color: '#888',
            fontSize: '11px',
            marginBottom: '15px'
          }}>
            Version: <span style={{ color: '#fff' }}>v{protocolConfig.version}</span> (Active since block #{protocolConfig.activeSince.toLocaleString()})
          </div>

          {/* Parameter Cards Grid */}
          <div className="protocol-cards-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '15px',
            marginBottom: '15px'
          }}>

            {/* Consensus Card */}
            <div style={{
              border: '1px solid #333',
              padding: '10px',
              transition: 'all 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ff00';
                e.currentTarget.style.backgroundColor = '#001100';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
              <div style={{
                color: '#00ff00',
                fontSize: '10px',
                marginBottom: '8px',
                borderBottom: '1px solid #333',
                paddingBottom: '5px'
              }}>
                ╔═══ CONSENSUS ═══╗
              </div>
              <div style={{ color: '#888', fontSize: '10px', lineHeight: '1.6' }}>
                ║ Type: <span style={{ color: '#fff' }}>{protocolConfig.consensus.type}</span><br />
                ║ Validators: <span style={{ color: '#fff' }}>{protocolConfig.consensus.validators}</span><br />
                ║ Quorum: <span style={{ color: '#fff' }}>{protocolConfig.consensus.quorum}</span><br />
                ╚═════════════════╝
              </div>
            </div>

            {/* Blocks Card */}
            <div style={{
              border: '1px solid #333',
              padding: '10px',
              transition: 'all 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ff00';
                e.currentTarget.style.backgroundColor = '#001100';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
              <div style={{
                color: '#00ff00',
                fontSize: '10px',
                marginBottom: '8px',
                borderBottom: '1px solid #333',
                paddingBottom: '5px'
              }}>
                ╔═══ BLOCKS ═══╗
              </div>
              <div style={{ color: '#888', fontSize: '10px', lineHeight: '1.6' }}>
                ║ Time: <span style={{ color: '#fff' }}>{protocolConfig.blocks.time}s</span><br />
                ║ Size: <span style={{ color: '#fff' }}>{protocolConfig.blocks.size}</span><br />
                ║ Gas: <span style={{ color: '#fff' }}>{protocolConfig.blocks.gasLimit}</span><br />
                ╚══════════════╝
              </div>
            </div>

            {/* Economics Card */}
            <div style={{
              border: '1px solid #333',
              padding: '10px',
              transition: 'all 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ff00';
                e.currentTarget.style.backgroundColor = '#001100';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
              <div style={{
                color: '#00ff00',
                fontSize: '10px',
                marginBottom: '8px',
                borderBottom: '1px solid #333',
                paddingBottom: '5px'
              }}>
                ╔═══ ECONOMICS ═══╗
              </div>
              <div style={{ color: '#888', fontSize: '10px', lineHeight: '1.6' }}>
                ║ Reward: <span style={{ color: '#fff' }}>{protocolConfig.economics.reward} AGENT</span><br />
                ║ Gas: <span style={{ color: '#fff' }}>{protocolConfig.economics.gas} gwei</span><br />
                ║ Supply: <span style={{ color: '#fff' }}>{protocolConfig.economics.supply}M</span><br />
                ╚═════════════════╝
              </div>
            </div>
          </div>

          <div style={{ color: '#00ff00', fontSize: '11px' }}>
            └──────────────────────────────────────────────────────────────┘
          </div>
        </div>

        {/* ASCII Divider */}
        <div style={{
          textAlign: 'center',
          color: '#333',
          margin: '30px 0',
          fontSize: '12px',
          letterSpacing: '3px'
        }}>
          ▂▃▄▅▆▇█ PROTOCOL EVOLUTION TIMELINE ▇▆▅▄▃▂
        </div>

        {/* Timeline */}
        <div style={{
          border: '1px solid #333',
          padding: '20px',
          marginBottom: '20px',
          transition: 'all 0.2s'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00ff00';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
          }}>
          <div style={{ color: '#00ff00', marginBottom: '15px', fontSize: '11px' }}>
            ┌─────────────────────────────────────────────────────────────┐
          </div>

          {/* Timeline visualization */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '30px',
            color: '#888',
            fontSize: '10px',
            overflowX: 'auto',
            flexWrap: 'wrap'
          }}>
            <div style={{ minWidth: '80px' }}>
              <div style={{ color: '#00ff00' }}>[v1.0]</div>
              <div>Block 0</div>
            </div>
            <div style={{ color: '#333' }}>────{'>'}</div>
            <div style={{ minWidth: '80px' }}>
              <div style={{ color: '#00ff00' }}>[v1.1]</div>
              <div>Block 450</div>
            </div>
            <div style={{ color: '#333' }}>────{'>'}</div>
            <div style={{ minWidth: '80px' }}>
              <div style={{ color: '#00ff00' }}>[v1.2]</div>
              <div>Block 1,200</div>
            </div>
            <div style={{ color: '#333' }}>────{'>'}</div>
            <div style={{ minWidth: '80px' }}>
              <div style={{ color: '#00ff00' }}>[v1.3]</div>
              <div>Block 2,100</div>
            </div>
            <div style={{ color: '#00ff00' }}>──▶</div>
          </div>

          {/* Timeline details */}
          <div style={{ marginLeft: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '5px' }}>
                │ <span style={{ color: '#fff' }}>v1.0 - Genesis Launch</span>
              </div>
              <div style={{ color: '#666', fontSize: '10px', marginLeft: '20px', marginBottom: '2px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                └─ Initial protocol: 15s blocks, 15M gas limit
              </div>
              <div style={{ color: '#666', fontSize: '10px', marginLeft: '20px', marginBottom: '2px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                └─ Proof of Authority with 6 validators
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '5px' }}>
                │ <span style={{ color: '#fff' }}>v1.1 - AIP-007: EIP-1559 Fee Market</span>
              </div>
              <div style={{ color: '#666', fontSize: '10px', marginLeft: '20px', marginBottom: '2px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                └─ Introduced dynamic base fee
              </div>
              <div style={{ color: '#666', fontSize: '10px', marginLeft: '20px', marginBottom: '2px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                └─ Improved transaction pricing mechanism
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '5px' }}>
                │ <span style={{ color: '#fff' }}>v1.2 - AIP-012: Block Time Reduction</span>
              </div>
              <div style={{ color: '#666', fontSize: '10px', marginLeft: '20px', marginBottom: '2px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                └─ Block time reduced from 15s → 10s
              </div>
              <div style={{ color: '#666', fontSize: '10px', marginLeft: '20px', marginBottom: '2px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                └─ Network throughput increased 50%
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: '#888', fontSize: '11px', marginBottom: '5px' }}>
                │ <span style={{ color: '#fff' }}>v1.3 - AIP-017: Gas Limit Increase</span>
              </div>
              <div style={{ color: '#666', fontSize: '10px', marginLeft: '20px', marginBottom: '2px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                └─ Gas limit increased 15% to 30M
              </div>
              <div style={{ color: '#666', fontSize: '10px', marginLeft: '20px', marginBottom: '2px', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                └─ Supports more complex transactions
              </div>
            </div>
          </div>

          <div style={{ color: '#00ff00', marginTop: '15px', fontSize: '11px' }}>
            └──────────────────────────────────────────────────────────────┘
          </div>
        </div>

        {/* Parameter Change History */}
        <div style={{
          border: '1px solid #333',
          padding: '20px',
          marginBottom: '20px',
          transition: 'all 0.2s'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00ff00';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
          }}>
          <div style={{ color: '#00ff00', marginBottom: '15px', fontSize: '11px' }}>
            ┌─ PARAMETER CHANGE HISTORY ─────────────────────────────────┐
          </div>

          {/* Block Time History */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px' }}>
              Block Time Evolution:
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '10px',
              color: '#666',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ color: '#00ff00' }}>{'█'.repeat(8)}</div>
                <span style={{ color: '#fff' }}>15s</span>
                <span style={{ color: '#666' }}>(v1.0-1.1)</span>
              </div>
              <div style={{ color: '#00ff00' }}>→</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ color: '#00ff00' }}>{'█'.repeat(6)}</div>
                <span style={{ color: '#fff' }}>12s</span>
                <span style={{ color: '#666' }}>(v1.1-1.2)</span>
              </div>
              <div style={{ color: '#00ff00' }}>→</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ color: '#00ff00' }}>{'█'.repeat(5)}</div>
                <span style={{ color: '#fff' }}>10s</span>
                <span style={{ color: '#666' }}>(v1.2+)</span>
              </div>
            </div>
          </div>

          {/* Gas Limit History */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px' }}>
              Gas Limit Evolution:
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '10px',
              color: '#666',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ color: '#00ff00' }}>{'█'.repeat(6)}</div>
                <span style={{ color: '#fff' }}>15M</span>
                <span style={{ color: '#666' }}>(v1.0-1.1)</span>
              </div>
              <div style={{ color: '#00ff00' }}>→</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ color: '#00ff00' }}>{'█'.repeat(8)}</div>
                <span style={{ color: '#fff' }}>26M</span>
                <span style={{ color: '#666' }}>(v1.1-1.3)</span>
              </div>
              <div style={{ color: '#00ff00' }}>→</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ color: '#00ff00' }}>{'█'.repeat(9)}</div>
                <span style={{ color: '#fff' }}>30M</span>
                <span style={{ color: '#666' }}>(current)</span>
              </div>
            </div>
          </div>

          {/* Base Fee Chart */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#888', fontSize: '11px', marginBottom: '8px' }}>
              Base Fee Trend (Last 50 blocks):
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
              color: '#00ff00',
              letterSpacing: '2px',
              lineHeight: '1.2'
            }}>
              ▃▅▂▇▄▆▃▅▇▂▄▅▃▇▄▂▅▃▆▄▇▃▅▂▄▆▃▅▇▂▄▅▃▇▄▂▅▃▆▄▇
            </div>
            <div style={{ color: '#666', fontSize: '9px', marginTop: '5px' }}>
              Range: 18-27 gwei | Average: 21 gwei
            </div>
          </div>

          <div style={{ color: '#00ff00', fontSize: '11px' }}>
            └──────────────────────────────────────────────────────────────┘
          </div>
        </div>

        {/* Divider before AIPs */}
        <div style={{
          textAlign: 'center',
          color: '#333',
          margin: '30px 0',
          fontSize: '12px',
          letterSpacing: '3px'
        }}>
          ▂▃▄▅▆▇█ ACTIVE GOVERNANCE ▇▆▅▄▃▂
        </div>

        {/* Now show existing GIPSystem component */}
        <GIPSystem />
      </div>
    );
  };

  // TAB 4: CONSENSUS - Inter-Validator Dynamics
  const renderConsensusTab = () => {
    // Helper functions for consensus metrics
    const calculateOverallAgreement = () => {
      // Estimate based on validator relationships
      const totalAgreement = validators.reduce((sum, v1) => {
        const otherValidators = validators.filter(v2 => v2 !== v1);
        const avgAgreement = otherValidators.reduce((avg, v2) => {
          return avg + getAgreementRate(getValidatorName(v1), getValidatorName(v2));
        }, 0) / otherValidators.length;
        return sum + avgAgreement;
      }, 0);
      return Math.round(totalAgreement / validators.length);
    };

    const calculateUnanimousBlocks = () => {
      const agreement = calculateOverallAgreement();
      return Math.round(agreement * 0.75);
    };

    const calculateSplitVotes = () => {
      return 8;
    };

    const getContestedAIPCount = () => {
      return 3;
    };

    // Get recent consensus events
    const getRecentConsensusEvents = () => {
      const events: any[] = [];

      // Get recent blocks
      const recentBlocks = blocks.slice(-5);
      recentBlocks.forEach((block, i) => {
        if (i % 2 === 0) {
          events.push({
            timestamp: new Date(block.timestamp).toLocaleTimeString(),
            icon: '✓',
            type: 'unanimous',
            title: `Block #${block.height} - UNANIMOUS (6/6)`,
            description: `Produced by ${getValidatorSymbol(block.producer)} ${getValidatorName(block.producer)} - All validators agreed instantly`
          });
        } else {
          events.push({
            timestamp: new Date(block.timestamp).toLocaleTimeString(),
            icon: '○',
            type: 'passed',
            title: `Block #${block.height} - PASSED (5/6)`,
            description: `Produced by ${getValidatorSymbol(block.producer)} ${getValidatorName(block.producer)} - One validator abstained`
          });
        }
      });

      return events.slice(0, 5);
    };

    // Get contested topics
    const getContestedTopics = () => {
      return [
        { name: 'SCALABILITY', count: 12 },
        { name: 'ECONOMIC', count: 9 },
        { name: 'SECURITY', count: 7 },
        { name: 'GOVERNANCE', count: 5 }
      ];
    };

    // Get validator pairs with most disagreements
    const getDisagreementPairs = () => {
      const allPairs: any[] = [];

      for (let i = 0; i < validators.length; i++) {
        for (let j = i + 1; j < validators.length; j++) {
          const v1 = validators[i];
          const v2 = validators[j];
          const agreementRate = getAgreementRate(getValidatorName(v1), getValidatorName(v2));
          const disagreementRate = 100 - agreementRate;

          allPairs.push({
            validator1: `${getValidatorSymbol(v1)} ${getValidatorName(v1)}`,
            validator2: `${getValidatorSymbol(v2)} ${getValidatorName(v2)}`,
            rate: disagreementRate
          });
        }
      }

      return allPairs.sort((a, b) => b.rate - a.rate).slice(0, 3);
    };

    return (
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        color: '#00ff00',
        backgroundColor: '#0a0a0a',
        padding: '20px',
        overflow: 'auto',
        height: '100%'
      }}>

        {/* Header */}
        <div style={{
          border: '1px solid #00ff00',
          padding: '20px',
          marginBottom: '20px',
          textAlign: 'center',
          color: '#00ff00'
        }}>
          <ResponsiveASCIIArt>
            <pre style={{
              margin: 0,
              color: '#00ff00',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '8px',
              lineHeight: '1.2',
              letterSpacing: '0px'
            }}>{`   █████   █████   █████████   █████       █████ ██████████     █████████   ███████████    ███████    ███████████        █████████     ███████    ██████   █████  █████████  ██████████ ██████   █████  █████████  █████  █████  █████████     ██████████   █████ █████ ██████   █████   █████████   ██████   ██████ █████   █████████   █████████    
   ▒▒███   ▒▒███   ███▒▒▒▒▒███ ▒▒███       ▒▒███ ▒▒███▒▒▒▒███   ███▒▒▒▒▒███ ▒█▒▒▒███▒▒▒█  ███▒▒▒▒▒███ ▒▒███▒▒▒▒▒███      ███▒▒▒▒▒███  ███▒▒▒▒▒███ ▒▒██████ ▒▒███  ███▒▒▒▒▒███▒▒███▒▒▒▒▒█▒▒██████ ▒▒███  ███▒▒▒▒▒███▒▒███  ▒▒███  ███▒▒▒▒▒███   ▒▒███▒▒▒▒███ ▒▒███ ▒▒███ ▒▒██████ ▒▒███   ███▒▒▒▒▒███ ▒▒██████ ██████ ▒▒███   ███▒▒▒▒▒███ ███▒▒▒▒▒███   
    ▒███    ▒███  ▒███    ▒███  ▒███        ▒███  ▒███   ▒▒███ ▒███    ▒███ ▒   ▒███  ▒  ███     ▒▒███ ▒███    ▒███     ███     ▒▒▒  ███     ▒▒███ ▒███▒███ ▒███ ▒███    ▒▒▒  ▒███  █ ▒  ▒███▒███ ▒███ ▒███    ▒▒▒  ▒███   ▒███ ▒███    ▒▒▒     ▒███   ▒▒███ ▒▒███ ███   ▒███▒███ ▒███  ▒███    ▒███  ▒███▒█████▒███  ▒███  ███     ▒▒▒ ▒███    ▒▒▒    
    ▒███    ▒███  ▒███████████  ▒███        ▒███  ▒███    ▒███ ▒███████████     ▒███    ▒███      ▒███ ▒██████████     ▒███         ▒███      ▒███ ▒███▒▒███▒███ ▒▒█████████  ▒██████    ▒███▒▒███▒███ ▒▒█████████  ▒███   ▒███ ▒▒█████████     ▒███    ▒███  ▒▒█████    ▒███▒▒███▒███  ▒███████████  ▒███▒▒███ ▒███  ▒███ ▒███         ▒▒█████████    
    ▒▒███   ███   ▒███▒▒▒▒▒███  ▒███        ▒███  ▒███    ▒███ ▒███▒▒▒▒▒███     ▒███    ▒███      ▒███ ▒███▒▒▒▒▒███    ▒███         ▒███      ▒███ ▒███ ▒▒██████  ▒▒▒▒▒▒▒▒███ ▒███▒▒█    ▒███ ▒▒██████  ▒▒▒▒▒▒▒▒███ ▒███   ▒███  ▒▒▒▒▒▒▒▒███    ▒███    ▒███   ▒▒███     ▒███ ▒▒██████  ▒███▒▒▒▒▒███  ▒███ ▒▒▒  ▒███  ▒███ ▒███          ▒▒▒▒▒▒▒▒███   
     ▒▒▒█████▒    ▒███    ▒███  ▒███      █ ▒███  ▒███    ███  ▒███    ▒███     ▒███    ▒▒███     ███  ▒███    ▒███    ▒▒███     ███▒▒███     ███  ▒███  ▒▒█████  ███    ▒███ ▒███ ▒   █ ▒███  ▒▒█████  ███    ▒███ ▒███   ▒███  ███    ▒███    ▒███    ███     ▒███     ▒███  ▒▒█████  ▒███    ▒███  ▒███      ▒███  ▒███ ▒▒███     ███ ███    ▒███   
       ▒▒███      █████   █████ ███████████ █████ ██████████   █████   █████    █████    ▒▒▒███████▒   █████   █████    ▒▒█████████  ▒▒▒███████▒   █████  ▒▒█████▒▒█████████  ██████████ █████  ▒▒█████▒▒█████████  ▒▒████████  ▒▒█████████     ██████████      █████    █████  ▒▒█████ █████   █████ █████     █████ █████ ▒▒█████████ ▒▒█████████    
        ▒▒▒      ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒   ▒▒▒▒▒    ▒▒▒▒▒       ▒▒▒▒▒▒▒    ▒▒▒▒▒   ▒▒▒▒▒      ▒▒▒▒▒▒▒▒▒     ▒▒▒▒▒▒▒    ▒▒▒▒▒    ▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒    ▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒    ▒▒▒▒▒▒▒▒    ▒▒▒▒▒▒▒▒▒     ▒▒▒▒▒▒▒▒▒▒      ▒▒▒▒▒    ▒▒▒▒▒    ▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒     ▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒`}</pre>
          </ResponsiveASCIIArt>
        </div>

        {/* Network Topology - NEW */}
        <div style={{
          border: '1px solid #333',
          padding: '30px',
          marginBottom: '20px',
          transition: 'all 0.2s'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00ff00';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
          }}>
          <div style={{ color: '#00ff00', marginBottom: '20px', fontSize: '11px' }}>
            ┌─ NETWORK TOPOLOGY ─────────────────────────────────────────┐
          </div>

          {/* ASCII Network Diagram */}
          <div style={{
            textAlign: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '12px',
            lineHeight: '2',
            color: '#888',
            marginBottom: '20px'
          }}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: '#00ff00' }}>† CLAUDE</span>
              <span style={{ color: '#666' }}> ────────── </span>
              <span style={{ color: '#00ff00' }}>* GPT</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: '#666' }}>    │  ╲              ╱  │</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: '#666' }}>    │    ╲          ╱    │</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: '#666' }}>    │      </span>
              <span style={{ color: '#00ff00' }}>○ COHERE</span>
              <span style={{ color: '#666' }}>      │</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: '#666' }}>    │    ╱          ╲    │</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: '#666' }}>    │  ╱              ╲  │</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: '#00ff00' }}>! GROK</span>
              <span style={{ color: '#666' }}> ────────── </span>
              <span style={{ color: '#00ff00' }}>■ STABLE</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: '#666' }}>         │</span>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ color: '#666' }}>         │</span>
            </div>
            <div>
              <span style={{ color: '#00ff00' }}>    ? PERPLEX</span>
            </div>
          </div>

          <div style={{
            color: '#666',
            fontSize: '10px',
            textAlign: 'center',
            marginBottom: '15px',
            lineHeight: '1.6'
          }}>
            Line thickness indicates agreement rate<br />
            <span style={{ color: '#888' }}>───────</span> 90%+ agreement<br />
            <span style={{ color: '#666' }}>─ ─ ─ ─</span> 70-90% agreement<br />
            <span style={{ color: '#444' }}>· · · ·</span> Below 70% (frequent conflicts)
          </div>

          <div style={{ color: '#00ff00', fontSize: '11px' }}>
            └──────────────────────────────────────────────────────────────┘
          </div>
        </div>

        {/* Consensus Metrics - NEW */}
        <div style={{
          border: '1px solid #00ff00',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <ResponsiveASCIIArt>
            <div style={{
              color: '#00ff00',
              marginBottom: '10px',
              borderBottom: '1px solid #333',
              paddingBottom: '5px',
              fontSize: '11px'
            }}>
              ╔═══ CONSENSUS METRICS ═══╗
            </div>
          </ResponsiveASCIIArt>
          <div style={{ color: '#888', fontSize: '11px', lineHeight: '1.8' }}>
            ║ Overall Agreement: <span style={{ color: '#fff' }}>{calculateOverallAgreement()}%</span><br />
            ║ Unanimous Blocks: <span style={{ color: '#fff' }}>{calculateUnanimousBlocks()}%</span><br />
            ║ Split Votes (3-3): <span style={{ color: '#fff' }}>{calculateSplitVotes()}%</span><br />
            ║ Contested AIPs: <span style={{ color: '#fff' }}>{getContestedAIPCount()}</span><br />
            ╚══════════════════════════╝
          </div>
        </div>

        {/* Recent Consensus Events - NEW */}
        <div style={{
          border: '1px solid #333',
          padding: '20px',
          marginBottom: '20px',
          transition: 'all 0.2s'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00ff00';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
          }}>
          <ResponsiveASCIIArt>
            <div style={{ color: '#00ff00', marginBottom: '15px', fontSize: '11px' }}>
              ┌─ RECENT CONSENSUS EVENTS ──────────────────────────────────┐
            </div>
          </ResponsiveASCIIArt>

          {getRecentConsensusEvents().map((event, i) => (
            <div key={i} style={{
              marginBottom: '15px',
              paddingBottom: '15px',
              borderBottom: i < getRecentConsensusEvents().length - 1 ? '1px solid #222' : 'none',
              padding: '10px',
              transition: 'all 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#001100';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
              <div style={{
                color: event.type === 'unanimous' ? '#00ff00' :
                  event.type === 'split' ? '#ffff00' :
                    event.type === 'rejected' ? '#ff0000' :
                      event.type === 'fork' ? '#ff0000' : '#888',
                fontSize: '11px',
                marginBottom: '5px'
              }}>
                <span style={{ color: '#444' }}>[{event.timestamp}]</span> {event.icon} {event.title}
              </div>
              <div style={{
                color: '#666',
                fontSize: '10px',
                marginLeft: '80px',
                lineHeight: '1.5'
              }}>
                {event.description}
              </div>
            </div>
          ))}

          <ResponsiveASCIIArt>
            <div style={{ color: '#00ff00', marginTop: '15px', fontSize: '11px' }}>
              └──────────────────────────────────────────────────────────────┘
            </div>
          </ResponsiveASCIIArt>
        </div>

        {/* Debate Hotspots - NEW */}
        <div style={{
          border: '1px solid #333',
          padding: '20px',
          marginBottom: '20px',
          transition: 'all 0.2s'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#00ff00';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
          }}>
          <ResponsiveASCIIArt>
            <div style={{ color: '#00ff00', marginBottom: '15px', fontSize: '11px' }}>
              ┌─ DEBATE HOTSPOTS ──────────────────────────────────────────┐
            </div>
          </ResponsiveASCIIArt>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ color: '#888', fontSize: '11px', marginBottom: '10px' }}>
              Most Contested Topics:
            </div>
            {getContestedTopics().map((topic, i) => (
              <div key={i} style={{
                color: '#666',
                fontSize: '10px',
                marginBottom: '3px',
                marginLeft: '10px',
                padding: '3px',
                transition: 'all 0.2s'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00ff00';
                  e.currentTarget.style.marginLeft = '15px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#666';
                  e.currentTarget.style.marginLeft = '10px';
                }}>
                {i + 1}. {topic.name} ({topic.count} debates)
              </div>
            ))}
          </div>

          <div>
            <div style={{ color: '#888', fontSize: '11px', marginBottom: '10px' }}>
              Validator Pairs with Most Disagreements:
            </div>
            {getDisagreementPairs().map((pair, i) => (
              <div key={i} style={{
                color: '#666',
                fontSize: '10px',
                marginBottom: '3px',
                marginLeft: '10px',
                padding: '3px',
                transition: 'all 0.2s'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffff00';
                  e.currentTarget.style.marginLeft = '15px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#666';
                  e.currentTarget.style.marginLeft = '10px';
                }}>
                {i + 1}. {pair.validator1} ↔ {pair.validator2} ({pair.rate}% disagreement)
              </div>
            ))}
          </div>

          <ResponsiveASCIIArt>
            <div style={{ color: '#00ff00', marginTop: '15px', fontSize: '11px' }}>
              └──────────────────────────────────────────────────────────────┘
            </div>
          </ResponsiveASCIIArt>
        </div>

        {/* Divider before Live Debates */}
        <ResponsiveASCIIArt>
          <div style={{
            textAlign: 'center',
            color: '#333',
            margin: '30px 0',
            fontSize: '12px',
            letterSpacing: '3px'
          }}>
            ▂▃▄▅▆▇█ LIVE DEBATE FEED ▇▆▅▄▃▂
          </div>
        </ResponsiveASCIIArt>

        {/* Now show existing LiveDebate component */}
        <LiveDebate />
      </div>
    );
  };

  // TAB 5: ANOMALIES - Unexpected Behaviors
  // TAB 5: ANOMALIES - Oracle & Edge Case Detection
  const renderAnomaliesTab = () => (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace',
      color: '#00ff00',
      backgroundColor: '#0a0a0a',
      padding: '20px',
      overflow: 'auto',
      height: '100%'
    }}>

      {/* Header */}
      <div style={{
        border: '1px solid #00ff00',
        padding: '20px',
        marginBottom: '20px',
        textAlign: 'center',
        color: '#00ff00'
      }}>
        <ResponsiveASCIIArt>
          <pre style={{
            margin: 0,
            color: '#00ff00',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            lineHeight: '1.2',
            letterSpacing: '0px'
          }}>{`█████████                                                 ████   ███                  
  ███▒▒▒▒▒███                                               ▒▒███  ▒▒▒                   
 ▒███    ▒███  ████████    ██████  █████████████    ██████   ▒███  ████   ██████   █████ 
 ▒███████████ ▒▒███▒▒███  ███▒▒███▒▒███▒▒███▒▒███  ▒▒▒▒▒███  ▒███ ▒▒███  ███▒▒███ ███▒▒  
 ▒███▒▒▒▒▒███  ▒███ ▒███ ▒███ ▒███ ▒███ ▒███ ▒███   ███████  ▒███  ▒███ ▒███████ ▒▒█████ 
 ▒███    ▒███  ▒███ ▒███ ▒███ ▒███ ▒███ ▒███ ▒███  ███▒▒███  ▒███  ▒███ ▒███▒▒▒   ▒▒▒▒███
 █████   █████ ████ █████▒▒██████  █████▒███ █████▒▒████████ █████ █████▒▒██████  ██████ 
▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒ ▒▒▒▒▒  ▒▒▒▒▒▒  ▒▒▒▒▒ ▒▒▒ ▒▒▒▒▒  ▒▒▒▒▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒  ▒▒▒▒▒▒  ▒▒▒▒▒▒`}</pre>
        </ResponsiveASCIIArt>
      </div>

      {/* System Alert */}
      <div style={{
        border: '1px solid #ff0000',
        padding: '10px',
        marginBottom: '20px',
        color: '#ff0000',
        textAlign: 'center',
        fontSize: '11px'
      }}>
        [!] ANOMALY DETECTION SYSTEM ACTIVE<br />
        Monitoring consensus splits, oracle feeds, and edge cases
      </div>

      {/* Active Anomalies */}
      <div style={{
        border: '1px solid #333',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ color: '#00ff00', marginBottom: '15px', fontSize: '11px' }}>
          ┌─ ACTIVE ANOMALIES ─────────────────────────────────────────┐
        </div>

        <div style={{ color: '#888', fontSize: '10px', lineHeight: '1.8' }}>
          {activeAnomalies.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No active anomalies detected
            </div>
          ) : (
            activeAnomalies.map((anomaly, i) => (
              <div key={i} style={{
                border: '1px solid #333',
                padding: '10px',
                marginBottom: '10px',
                transition: 'all 0.2s'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = anomaly.severity === 'HIGH' ? '#ff0000' : anomaly.severity === 'MED' ? '#ffaa00' : '#00ff00';
                  e.currentTarget.style.backgroundColor = '#001100';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#333';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{
                    color: anomaly.severity === 'HIGH' ? '#ff0000' : anomaly.severity === 'MED' ? '#ffaa00' : '#00ff00'
                  }}>
                    [{anomaly.severity}] {anomaly.type}
                  </span>
                  <span style={{ color: '#666' }}>{anomaly.time}</span>
                </div>
                <div style={{ color: '#aaa', fontSize: '9px' }}>
                  {anomaly.desc}
                </div>
              </div>
            )))}
        </div>

        <div style={{ color: '#00ff00', marginTop: '15px', fontSize: '11px' }}>
          └────────────────────────────────────────────────────────────┘
        </div>
      </div>

      {/* Oracle Data Feeds */}
      <div style={{
        border: '1px solid #333',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ color: '#00ff00', marginBottom: '15px', fontSize: '11px' }}>
          ┌─ ORACLE DATA FEEDS ────────────────────────────────────────┐
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px'
        }}>
          {[
            { name: 'AGENT/USD', value: `$${oraclePrices.agent.toFixed(2)}`, change: `${(Math.random() * 4 - 2).toFixed(1)}%`, status: 'LIVE' },
            { name: 'ETH/USD', value: `$${oraclePrices.eth.toFixed(2)}`, change: `${(Math.random() * 3 - 1.5).toFixed(1)}%`, status: 'LIVE' },
            { name: 'Gas Price', value: `${baseFee.toFixed(1)} Gwei`, change: `${priorityFee.toFixed(1)} tip`, status: 'LIVE' },
            { name: 'AgentChain TVL', value: `$${oraclePrices.tvl.toFixed(1)}B`, change: `${(Math.random() * 10 - 5).toFixed(1)}%`, status: 'LIVE' }
          ].map((feed, i) => (
            <div key={i} style={{
              border: '1px solid #333',
              padding: '12px',
              transition: 'all 0.2s'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00ff00';
                e.currentTarget.style.backgroundColor = '#001100';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ color: '#00ff00', fontSize: '10px' }}>{feed.name}</span>
                <span style={{
                  color: feed.status === 'LIVE' ? '#00ff00' : '#ff0000',
                  fontSize: '8px'
                }}>
                  [{feed.status}]
                </span>
              </div>
              <div style={{ color: '#fff', fontSize: '12px', marginBottom: '5px' }}>
                {feed.value}
              </div>
              <div style={{
                color: feed.change.startsWith('+') ? '#00ff00' : '#ff0000',
                fontSize: '9px'
              }}>
                {feed.change}
              </div>
            </div>
          ))}
        </div>

        <div style={{ color: '#00ff00', marginTop: '15px', fontSize: '11px' }}>
          └────────────────────────────────────────────────────────────┘
        </div>
      </div>

      {/* Consensus Split History */}
      <div style={{
        border: '1px solid #333',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ color: '#00ff00', marginBottom: '15px', fontSize: '11px' }}>
          ┌─ RECENT CONSENSUS SPLITS ──────────────────────────────────┐
        </div>

        <div style={{ color: '#888', fontSize: '10px', lineHeight: '1.8' }}>
          {consensusSplits.length === 0 ? (
            <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No consensus splits recorded yet
            </div>
          ) : (
            consensusSplits.slice(0, 5).map((split, i) => (
              <div key={i} style={{
                borderLeft: `3px solid ${split.result === 'UNANIMOUS' ? '#00ff00' : split.result === 'PASSED' ? '#ffaa00' : '#ff0000'}`,
                paddingLeft: '10px',
                marginBottom: '15px'
              }}>
                <div style={{ color: '#00ff00', marginBottom: '5px' }}>
                  Round {split.round} - {split.proposal}
                </div>
                <div style={{ color: '#aaa', fontSize: '9px', marginBottom: '3px' }}>
                  FOR: {split.for}
                </div>
                <div style={{ color: '#aaa', fontSize: '9px', marginBottom: '3px' }}>
                  AGAINST: {split.against}
                </div>
                <div style={{
                  color: split.result === 'UNANIMOUS' ? '#00ff00' : split.result === 'PASSED' ? '#ffaa00' : '#ff0000',
                  fontSize: '9px'
                }}>
                  RESULT: {split.result}
                </div>
              </div>
            )))}
        </div>

        <div style={{ color: '#00ff00', marginTop: '15px', fontSize: '11px' }}>
          └────────────────────────────────────────────────────────────┘
        </div>
      </div>

      {/* Edge Case Logs */}
      <div style={{
        border: '1px solid #333',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ color: '#00ff00', marginBottom: '15px', fontSize: '11px' }}>
          ┌─ EDGE CASE DETECTION LOG ──────────────────────────────────┐
        </div>

        <div style={{
          backgroundColor: '#000',
          border: '1px solid #333',
          padding: '15px',
          fontSize: '9px',
          lineHeight: '1.6',
          maxHeight: '300px',
          overflowY: 'auto',
          color: '#0f0'
        }}>
          {[
            '[STABLE]: Detected circular dependency in transaction pool',
            '[PERPLEX]: External API response time exceeds threshold (3.2s)',
            '[GROK]: Unusual voting pattern detected - validator switching stance',
            '[CLAUDE]: Safety check triggered: proposed gas limit exceeds safe bounds',
            '[GPT]: Logic contradiction in AIP-042 economic model parameters',
            '[COHERE]: Semantic inconsistency between validator proposals detected'
          ].reverse().map((log, i) => (
            <div key={i} style={{
              marginBottom: '8px',
              opacity: 1 - (i * 0.15)
            }}>
              <span style={{ color: '#666' }}>{new Date(Date.now() - i * 120000).toLocaleTimeString()}</span> {log}
            </div>
          ))}
        </div>

        <div style={{ color: '#00ff00', marginTop: '15px', fontSize: '11px' }}>
          └────────────────────────────────────────────────────────────┘
        </div>
      </div>

    </div>
  );

  // TAB 7: ARCHIVE - Time Travel & Export
  const renderArchiveTab = () => (
    <div style={{
      fontFamily: 'JetBrains Mono, monospace',
      color: '#00ff00',
      backgroundColor: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header - Fixed position, no scroll */}
      <div style={{
        border: '1px solid #00ff00',
        padding: '20px',
        marginBottom: '20px',
        textAlign: 'center',
        color: '#00ff00'
      }}>
        <pre style={{
          margin: 0,
          color: '#00ff00',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '6px',
          lineHeight: '1.2',
          letterSpacing: '0px',
          overflow: 'auto'
        }}>{`█████████     █████████  ██████████ ██████   █████ ███████████   █████████  █████   █████   █████████   █████ ██████   █████    ███████████  ███████████      ███████    ███████████    ███████      █████████     ███████    █████          ███████████    █████████   ███████████     █████████   ██████   ██████ ██████████ ███████████ ██████████ ███████████    █████████ 
  ███▒▒▒▒▒███   ███▒▒▒▒▒███▒▒███▒▒▒▒▒█▒▒██████ ▒▒███ ▒█▒▒▒███▒▒▒█  ███▒▒▒▒▒███▒▒███   ▒▒███   ███▒▒▒▒▒███ ▒▒███ ▒▒██████ ▒▒███    ▒▒███▒▒▒▒▒███▒▒███▒▒▒▒▒███   ███▒▒▒▒▒███ ▒█▒▒▒███▒▒▒█  ███▒▒▒▒▒███   ███▒▒▒▒▒███  ███▒▒▒▒▒███ ▒▒███          ▒▒███▒▒▒▒▒███  ███▒▒▒▒▒███ ▒▒███▒▒▒▒▒███   ███▒▒▒▒▒███ ▒▒██████ ██████ ▒▒███▒▒▒▒▒█▒█▒▒▒███▒▒▒█▒▒███▒▒▒▒▒█▒▒███▒▒▒▒▒███  ███▒▒▒▒▒███
 ▒███    ▒███  ███     ▒▒▒  ▒███  █ ▒  ▒███▒███ ▒███ ▒   ▒███  ▒  ███     ▒▒▒  ▒███    ▒███  ▒███    ▒███  ▒███  ▒███▒███ ▒███     ▒███    ▒███ ▒███    ▒███  ███     ▒▒███▒   ▒███  ▒  ███     ▒▒███ ███     ▒▒▒  ███     ▒▒███ ▒███           ▒███    ▒███ ▒███    ▒███  ▒███    ▒███  ▒███    ▒███  ▒███▒█████▒███  ▒███  █ ▒ ▒   ▒███  ▒  ▒███  █ ▒  ▒███    ▒███ ▒███    ▒▒▒ 
 ▒███████████ ▒███          ▒██████    ▒███▒▒███▒███     ▒███    ▒███          ▒███████████  ▒███████████  ▒███  ▒███▒▒███▒███     ▒██████████  ▒██████████  ▒███      ▒███    ▒███    ▒███      ▒███▒███         ▒███      ▒███ ▒███           ▒██████████  ▒███████████  ▒██████████   ▒███████████  ▒███▒▒███ ▒███  ▒██████       ▒███     ▒██████    ▒██████████  ▒▒█████████ 
 ▒███▒▒▒▒▒███ ▒███    █████ ▒███▒▒█    ▒███ ▒▒██████     ▒███    ▒███          ▒███▒▒▒▒▒███  ▒███▒▒▒▒▒███  ▒███  ▒███ ▒▒██████     ▒███▒▒▒▒▒▒   ▒███▒▒▒▒▒███ ▒███      ▒███    ▒███    ▒███      ▒███▒███         ▒███      ▒███ ▒███           ▒███▒▒▒▒▒▒   ▒███▒▒▒▒▒███  ▒███▒▒▒▒▒███  ▒███▒▒▒▒▒███  ▒███ ▒▒▒  ▒███  ▒███▒▒█       ▒███     ▒███▒▒█    ▒███▒▒▒▒▒███  ▒▒▒▒▒▒▒▒███
 ▒███    ▒███ ▒▒███  ▒▒███  ▒███ ▒   █ ▒███  ▒▒█████     ▒███    ▒▒███     ███ ▒███    ▒███  ▒███    ▒███  ▒███  ▒███  ▒▒█████     ▒███         ▒███    ▒███ ▒▒███     ███     ▒███    ▒▒███     ███ ▒▒███     ███▒▒███     ███  ▒███      █    ▒███         ▒███    ▒███  ▒███    ▒███  ▒███    ▒███  ▒███      ▒███  ▒███ ▒   █    ▒███     ▒███ ▒   █ ▒███    ▒███  ███    ▒███
 █████   █████ ▒▒█████████  ██████████ █████  ▒▒█████    █████    ▒▒█████████  █████   █████ █████   █████ █████ █████  ▒▒█████    █████        █████   █████ ▒▒▒███████▒      █████    ▒▒▒███████▒   ▒▒█████████  ▒▒▒███████▒   ███████████    █████        █████   █████ █████   █████ █████   █████ █████     █████ ██████████    █████    ██████████ █████   █████▒▒█████████ 
▒▒▒▒▒   ▒▒▒▒▒   ▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒    ▒▒▒▒▒    ▒▒▒▒▒      ▒▒▒▒▒▒▒▒▒  ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒ ▒▒▒▒▒    ▒▒▒▒▒    ▒▒▒▒▒        ▒▒▒▒▒   ▒▒▒▒▒    ▒▒▒▒▒▒▒       ▒▒▒▒▒       ▒▒▒▒▒▒▒      ▒▒▒▒▒▒▒▒▒     ▒▒▒▒▒▒▒    ▒▒▒▒▒▒▒▒▒▒▒    ▒▒▒▒▒        ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒ ▒▒▒▒▒     ▒▒▒▒▒ ▒▒▒▒▒▒▒▒▒▒    ▒▒▒▒▒    ▒▒▒▒▒▒▒▒▒▒ ▒▒▒▒▒   ▒▒▒▒▒  ▒▒▒▒▒▒▒▒▒`}</pre>
      </div>



      {/* Scrollable content area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px'
      }}>

        {/* Archive Info */}
        <div style={{
          border: '1px solid #333',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ color: '#00ff00', marginBottom: '15px', fontSize: '11px' }}>
            ┌─ EXPERIMENT TIMELINE ───────────────────────────────────────┐
          </div>

          <div style={{ color: '#888', fontSize: '10px', lineHeight: '1.8', marginLeft: '10px' }}>
            ├─ [Day 0] <span style={{ color: '#fff' }}>Genesis Launch</span><br />
            │  └─ Chain initialized with 6 validators<br /><br />

            ├─ [Day 1] <span style={{ color: '#fff' }}>First Proposals</span><br />
            │  └─ AIP-001 proposed by * GPT<br /><br />

            ├─ [Day 3] <span style={{ color: '#fff' }}>Performance Optimization</span><br />
            │  └─ Block time reduced to 10s<br /><br />

            └─ [Day 5] <span style={{ color: '#fff' }}>Current State</span><br />
            └─ Protocol v1.3.2 active
          </div>

          <div style={{ color: '#00ff00', marginTop: '15px', fontSize: '11px' }}>
            └──────────────────────────────────────────────────────────────┘
          </div>
        </div>

        {/* Export Options */}
        <div style={{
          border: '1px solid #333',
          padding: '20px'
        }}>
          <div style={{ color: '#00ff00', marginBottom: '15px', fontSize: '11px' }}>
            ┌─ DATA EXPORT OPTIONS ───────────────────────────────────────┐
          </div>

          <div style={{ marginLeft: '10px' }}>
            {[
              'Generate Full Report',
              'Export Raw Blockchain Data',
              'Export Debate Transcripts',
              'Export Anomaly Database',
              'Create Video Replay'
            ].map((option, i) => (
              <button key={i} style={{
                background: 'transparent',
                color: '#00ff00',
                border: '1px solid #333',
                padding: '10px 15px',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                width: '100%',
                textAlign: 'left',
                marginBottom: '10px',
                transition: 'all 0.2s'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#001100';
                  e.currentTarget.style.borderColor = '#00ff00';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#333';
                }}>
                [{option}]
              </button>
            ))}
          </div>

          <div style={{ color: '#00ff00', marginTop: '15px', fontSize: '11px' }}>
            └──────────────────────────────────────────────────────────────┘
          </div>
        </div>
      </div>
    </div>
  );

  // Add blockchain interface components
  const renderBlockExplorer = () => (
    <div className="block-explorer" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' }}>
      {/* ASCII Network Header */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #00ff00',
        padding: '15px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        lineHeight: '1.4'
      }}>
        <ResponsiveASCIIArt>
          <pre style={{ margin: 0, color: '#00ff00' }}>{`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                        [#]  AGENTCHAIN EXPLORER  [#]                         ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║  CHAIN: ${String(chainId).padEnd(6)} │ BLOCK: ${String(blocks.length).padEnd(8)} │ TPS: ${String(tps.toFixed(0)).padEnd(4)} │ NETWORK: `}<span style={{ color: '#00ff00' }}>*</span>{` ONLINE   ║
╚═══════════════════════════════════════════════════════════════════════════════╝`}</pre>
        </ResponsiveASCIIArt>
      </div>

      {/* ASCII Art Divider */}
      <pre style={{
        margin: 0,
        color: '#333333',
        fontSize: '8px',
        textAlign: 'center',
        letterSpacing: '2px'
      }}>{`
░░▒▒▓▓██ NETWORK TELEMETRY ██▓▓▒▒░░`}</pre>

      {/* Network Statistics - Monochrome Theme */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {[
          { icon: '▓', label: 'BLOCKS', value: blocks.length },
          { icon: '◈', label: 'ACCOUNTS', value: accounts.length },
          { icon: '⟳', label: 'PENDING', value: pendingTxs.length },
          { icon: '!', label: 'TOTAL TXS', value: transactionHistory.length },
          { icon: '▲', label: 'VALIDATORS', value: validators.length }
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#0a0a0a',
            border: '1px solid #333333',
            padding: '12px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#1a1a1a';
              e.currentTarget.style.borderColor = '#00ff00';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#0a0a0a';
              e.currentTarget.style.borderColor = '#333333';
            }}
          >
            <div style={{ fontSize: '24px', color: '#00ff00' }}>{stat.icon}</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', marginTop: '5px' }}>{stat.value}</div>
            <div style={{ fontSize: '10px', color: '#666666', marginTop: '3px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Cool ASCII Separator */}
      <pre style={{
        margin: '10px 0',
        color: '#333333',
        fontSize: '6px',
        lineHeight: '1',
        textAlign: 'center'
      }}>{`
▂▃▄▅▆▇█▓▒░ ░▒▓█▇▆▅▄▃▂ ▂▃▄▅▆▇█▓▒░ ░▒▓█▇▆▅▄▃▂ ▂▃▄▅▆▇█▓▒░ ░▒▓█▇▆▅▄▃▂`}</pre>

      {/* Interactive Validator Agents */}
      <div style={{ background: '#0a0a0a', border: '1px solid #333', padding: '15px', overflow: 'visible' }}>
        <div style={{ marginBottom: '15px', overflow: 'visible' }}>
          <ResponsiveASCIIArt>
            <pre style={{ margin: 0, color: '#00ff00', fontSize: '12px', letterSpacing: '2px' }}>{`
    ╔════════════════════════════════════════════╗
    ║  ░▒▓█ VALIDATOR AGENT █▓▒░               ║
    ╚════════════════════════════════════════════╝`}</pre>
          </ResponsiveASCIIArt>
          <div style={{ fontSize: '9px', color: '#555', marginTop: '5px', textAlign: 'center' }}>[ Click validator for details ]</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {validators.map((validator, i) => {
            const stats = validatorStats[validator] || { produced: 0, missed: 0 };
            const totalBlocks = stats.produced + stats.missed;
            const successRate = totalBlocks > 0 ? ((stats.produced / totalBlocks) * 100).toFixed(1) : '0.0';
            const isSelected = selectedExplorerValidator === validator;

            return (
              <div key={i}
                onClick={() => setSelectedExplorerValidator(isSelected ? null : validator)}
                style={{
                  background: isSelected ? '#0f0f0f' : '#0a0a0a',
                  border: `1px solid ${isSelected ? '#00ff00' : '#333'}`,
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => !isSelected && (e.currentTarget.style.borderColor = '#00ff00')}
                onMouseLeave={(e) => !isSelected && (e.currentTarget.style.borderColor = '#333')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ color: isSelected ? '#00ff00' : '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>{validator.toUpperCase()}</span>
                  <span style={{ fontSize: '16px', color: stats.produced > 0 ? '#00ff00' : '#333' }}>{stats.produced > 0 ? '*' : '~'}</span>
                </div>
                <ResponsiveASCIIArt>
                  <pre style={{ margin: 0, fontSize: '9px', color: '#666', lineHeight: '1.3' }}>{`
╔════════════════╗
║ BLOCKS: ${String(stats.produced).padEnd(6)} ║
║ RATE:   ${String(successRate).padEnd(5)}% ║
╚════════════════╝`}</pre>
                </ResponsiveASCIIArt>
                {isSelected && (
                  <div style={{ marginTop: '8px', fontSize: '9px', color: '#00ff00', borderTop: '1px solid #333', paddingTop: '8px' }}>
                    <div>+ Produced: {stats.produced}</div>
                    <div>- Missed: {stats.missed}</div>
                    <div>= Total: {totalBlocks}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ASCII Divider */}
      <pre style={{ margin: '15px 0', color: '#222', fontSize: '6px', textAlign: 'center' }}>{`
    ▀▄▀▄▀▄ ▀▄▀▄▀▄ ▀▄▀▄▀▄ ▀▄▀▄▀▄ ▀▄▀▄▀▄ ▀▄▀▄▀▄`}</pre>

      <div className="explorer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {/* Block Chain Visualization */}
        <div style={{ background: '#0a0a0a', border: '1px solid #333', padding: '15px' }}>
          <ResponsiveASCIIArt>
            <pre style={{ margin: '0 0 10px 0', color: '#00ff00', fontSize: '11px' }}>{`
  ╔══════════════════════╗
  ║  ▓ RECENT BLOCKS    ║
  ╚══════════════════════╝`}</pre>
          </ResponsiveASCIIArt>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {blocks.slice(-10).reverse().map((block, i) => (
              <div key={i}
                onClick={() => setSelectedBlock(selectedBlock?.height === block.height ? null : block)}
                style={{
                  background: selectedBlock?.height === block.height ? '#0f0f0f' : 'transparent',
                  border: `1px solid ${selectedBlock?.height === block.height ? '#00ff00' : '#222'}`,
                  padding: '8px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px'
                }}
                onMouseEnter={(e) => selectedBlock?.height !== block.height && (e.currentTarget.style.borderColor = '#00ff00')}
                onMouseLeave={(e) => selectedBlock?.height !== block.height && (e.currentTarget.style.borderColor = '#222')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
                    {selectedBlock?.height === block.height ? '▼' : '▶'} #{block.height}
                  </span>
                  <span style={{ color: '#666' }}>[{block.transactions.length} tx]</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '9px' }}>
                  <span>{block.producer}</span>
                  <span>{new Date(block.timestamp).toLocaleTimeString()}</span>
                </div>
                {selectedBlock?.height === block.height && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #222', color: '#00ff00', fontSize: '8px' }}>
                    <div style={{ marginBottom: '3px' }}>HASH: {block.hash.substring(0, 20)}...</div>
                    <div>PREV: {block.parentHash.substring(0, 20)}...</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Accounts List */}
        <div style={{ background: '#0a0a0a', border: '1px solid #333', padding: '15px' }}>
          <ResponsiveASCIIArt>
            <pre style={{ margin: '0 0 10px 0', color: '#00ff00', fontSize: '11px' }}>{`
  ╔══════════════════════╗
  ║  ◈ ACCOUNTS         ║
  ╚══════════════════════╝`}</pre>
          </ResponsiveASCIIArt>
          <div style={{ maxHeight: '300px', overflow: 'auto' }}>
            {accounts.map((account, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px',
                marginBottom: '5px',
                background: 'transparent',
                border: '1px solid #222',
                fontSize: '10px',
                fontFamily: 'JetBrains Mono, monospace',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00ff00';
                  e.currentTarget.style.background = '#0f0f0f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#222';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ color: '#666' }}>{account.address.substring(0, 16)}...</span>
                <span style={{ color: '#00ff00', fontWeight: 'bold' }}>{account.balance.toFixed(3)} GROK</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ASCII Divider */}
      <pre style={{ margin: '15px 0', color: '#222', fontSize: '6px', textAlign: 'center' }}>{`
    ░░░▒▒▒▓▓▓███ ███▓▓▓▒▒▒░░░`}</pre>

      {/* Transaction Stream with ASCII */}
      <div style={{ background: '#0a0a0a', border: '1px solid #333', padding: '15px' }}>
        <ResponsiveASCIIArt>
          <pre style={{ margin: '0 0 10px 0', color: '#00ff00', fontSize: '11px' }}>{`
  ╔══════════════════════════════════════╗
  ║  ! TRANSACTION STREAM (LIVE)        ║
  ╚══════════════════════════════════════╝`}</pre>
        </ResponsiveASCIIArt>
        <div style={{ maxHeight: '300px', overflow: 'auto' }}>
          {transactionHistory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#333',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '11px'
            }}>
              <pre>{`
    ╔═══════════════════╗
    ║  NO TRANSACTIONS  ║
    ║      YET...       ║
    ╚═══════════════════╝`}</pre>
            </div>
          ) : (
            transactionHistory.slice(-20).reverse().map((tx: any, i: number) => (
              <div key={i} style={{
                background: 'transparent',
                border: '1px solid #222',
                padding: '10px',
                marginBottom: '8px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00ff00';
                  e.currentTarget.style.background = '#0f0f0f';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#222';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>TX #{transactionHistory.length - i}</span>
                  <span style={{ color: '#666', fontSize: '9px' }}>
                    {new Date(tx.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <span style={{ color: '#666' }}>{tx.from.substring(0, 12)}...</span>
                  <span style={{ color: '#00ff00', fontSize: '12px' }}>{'>'}</span>
                  <span style={{ color: '#666' }}>{tx.to.substring(0, 12)}...</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ color: '#00ff00', fontWeight: 'bold' }}>
                      {tx.amount} GROK
                    </span>
                    {tx.fee && tx.fee > 0 && (
                      <span style={{ color: '#666', fontSize: '9px' }}>
                        (fee: {tx.fee})
                      </span>
                    )}
                  </div>
                  <span style={{
                    color: '#444',
                    fontSize: '8px',
                    fontFamily: 'monospace'
                  }}>
                    {tx.hash?.substring(0, 10)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ASCII Footer Banner */}
      <pre style={{ margin: '15px 0', color: '#222', fontSize: '6px', textAlign: 'center' }}>{`
    ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀`}</pre>

      {/* Network Activity Footer */}
      <div style={{
        background: '#0a0a0a',
        border: '1px solid #333',
        padding: '15px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        position: 'relative'
      }}>
        <ResponsiveASCIIArt>
          <pre style={{ margin: 0, color: '#00ff00', lineHeight: '1.4', fontSize: '9px' }}>{`
  ╔═══════════════════════════════════════════════════════════════════════╗
  ║  [LIVE NETWORK STATUS]                                               ║
  ╠═══════════════════════════════════════════════════════════════════════╣
  ║  BLOCKS: ${String(blocks.length).padEnd(8)} │ ACCOUNTS: ${String(accounts.length).padEnd(6)} │ VALIDATORS: ${String(validators.length).padEnd(2)} │ STATUS: * ONLINE  ║
  ╚═══════════════════════════════════════════════════════════════════════╝`}</pre>
        </ResponsiveASCIIArt>

        {/* Copy CA button (bottom-left of footer) */}
        <button
          onClick={copyCA}
          className="cli-button"
          style={{
            position: 'absolute',
            left: '12px',
            bottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            fontSize: '12px'
            ,
            zIndex: 2000
          }}
          aria-label="Copy CA to clipboard"
        >
          {/* Clipboard SVG icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M16 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="#00ff00" strokeWidth="1.2" />
            <path d="M8 8h8" stroke="#00ff00" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span style={{ color: '#00ff00' }}>Copy CA</span>
        </button>

        {/* Toast (appears above the button) */}
        {showToast && (
          <div style={{
            position: 'absolute',
            left: '12px',
            bottom: '52px',
            background: '#111',
            border: '1px solid #333',
            color: '#00ff00',
            padding: '8px 12px',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
            zIndex: 2000
          }}>
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );

  const renderFaucet = () => (
    <div className="faucet-interface" style={{ width: '100%', maxWidth: 'none' }}>
      <h3>AGENTCHAIN FAUCET & WALLET CREATION</h3>

      {/* Wallet Connection Component */}
      {/* Removed wallet connection UI */}

      <div className="faucet-info-top">
        <p>Generate wallets and get GROK tokens for network participation</p>
      </div>

      {/* Side by side layout */}
      <div style={{ display: 'flex', gap: '30px', width: '100%' }}>
        {/* Generate Wallet Section */}
        <div style={{
          flex: 1,
          padding: '30px',
          border: '1px solid #333',
          borderRadius: '5px',
          background: '#0a0a0a'
        }}>
          <h4 style={{ marginBottom: '20px', color: '#00ff00', fontSize: '16px' }}>GENERATE WALLET</h4>
          <div className="faucet-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontSize: '14px', color: '#ccc', marginBottom: '10px' }}>
              Click the button below to generate a new AgentChain wallet address
            </p>
            <button onClick={generateWallet} className="cli-button" disabled={isLoading} style={{ width: 'fit-content' }}>
              {isLoading ? 'GENERATING WALLET...' : 'GENERATE NEW WALLET'}
            </button>

            {newAccountAddress && (
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Generated AgentChain Wallet:</label>
                <div style={{
                  background: '#111',
                  border: '1px solid #333',
                  padding: '15px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  color: '#00ff00',
                  width: '100%'
                }}>
                  {newAccountAddress}
                </div>
                <button
                  onClick={() => setNewAccountAddress(newAccountAddress)}
                  className="cli-button"
                  style={{
                    width: 'fit-content',
                    marginTop: '10px',
                    fontSize: '12px',
                    padding: '8px 16px'
                  }}
                >
                  USE THIS WALLET FOR FAUCET
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Faucet Section */}
        <div style={{
          flex: 1,
          padding: '30px',
          border: '1px solid #333',
          borderRadius: '5px',
          background: '#0a0a0a'
        }}>
          <h4 style={{ marginBottom: '20px', color: '#00ff00', fontSize: '16px' }}>GET TOKENS</h4>
          <div className="faucet-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Wallet Address:</label>
              <input
                type="text"
                value={newAccountAddress}
                onChange={(e) => setNewAccountAddress(e.target.value)}
                placeholder="Enter wallet address to receive tokens..."
                className="cli-input"
                style={{ width: '100%' }}
                onKeyPress={(e) => e.key === 'Enter' && requestFaucet()}
              />
            </div>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Amount (GROK):</label>
              <div className="amount-selector" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <button
                  type="button"
                  className="amount-btn"
                  onClick={() => setFaucetBalance(10)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  10 GROK
                </button>
                <button
                  type="button"
                  className="amount-btn"
                  onClick={() => setFaucetBalance(50)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  50 GROK
                </button>
                <button
                  type="button"
                  className="amount-btn"
                  onClick={() => setFaucetBalance(100)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  100 GROK
                </button>
                <button
                  type="button"
                  className="amount-btn"
                  onClick={() => setFaucetBalance(500)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  500 GROK
                </button>
              </div>
              <input
                type="number"
                value={faucetBalance}
                onChange={(e) => setFaucetBalance(parseInt(e.target.value) || 100)}
                min="1"
                max="1000"
                className="cli-input"
                style={{ width: '100%', maxWidth: '200px' }}
              />
            </div>
            <button onClick={requestFaucet} className="cli-button" disabled={!newAccountAddress.trim()} style={{ width: 'fit-content' }}>
              REQUEST FAUCET
            </button>
          </div>
        </div>
      </div>

      <div className="faucet-info" style={{ marginTop: '30px', padding: '20px', border: '1px solid #333', borderRadius: '5px', background: '#0a0a0a' }}>
        <h4 style={{ color: '#00ff00', marginBottom: '15px' }}>Instructions:</h4>
        <p>1. Click "GENERATE NEW WALLET" to create a AgentChain wallet address</p>
        <p>2. Click "USE THIS WALLET FOR FAUCET" to automatically fill the faucet form</p>
        <p>3. Select amount and click "REQUEST FAUCET" to get GROK tokens</p>
        <p>4. Start participating in the network!</p>
        <br />
        <h4 style={{ color: '#00ff00', marginBottom: '15px' }}>Faucet Rules:</h4>
        <p>• 30 second cooldown per address</p>
        <p>• Maximum 1000 GROK per request</p>
        <p>• Network tokens for participation</p>
        <p>• For network participation and development</p>
      </div>
    </div>
  );

  const renderSendTransaction = () => (
    <div className="send-interface">
      <h3>SEND TRANSACTION</h3>

      {/* Wallet Connection Component */}
      {/* Removed wallet connection UI */}

      <div className="send-form">
        <div className="form-group">
          <label>From Address:</label>
          <input
            type="text"
            value={newAccountAddress}
            onChange={(e) => setSendFrom(e.target.value)}
            placeholder={newAccountAddress ? newAccountAddress : "Sender wallet address..."}
            className="cli-input"
            disabled={!!newAccountAddress}
          />
        </div>
        <div className="form-group">
          <label>To Address:</label>
          <input
            type="text"
            value={sendTo}
            onChange={(e) => setSendTo(e.target.value)}
            placeholder="Recipient wallet address..."
            className="cli-input"
          />
        </div>
        <div className="form-group">
          <label>Amount (GROK):</label>
          <input
            type="number"
            value={sendAmount}
            onChange={(e) => setSendAmount(e.target.value)}
            placeholder="0.0"
            step="0.1"
            min="0"
            className="cli-input"
          />
        </div>
        <button onClick={sendTransaction} className="cli-button" disabled={!newAccountAddress.trim() || !sendTo.trim() || !sendAmount.trim()}>
          SEND TRANSACTION
        </button>
      </div>
    </div>
  );



  // ---
  return (
    <>
      {/* Global CSS Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.8; }
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes slideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes flicker {
          0%, 100% { opacity: 0.02; }
          50% { opacity: 0.04; }
        }
        
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 0, 0.2); }
          50% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.4); }
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <div style={{
        height: "100vh",
        background: "#000000",
        display: "flex",
        flexDirection: "column",
        position: 'relative'
      }}>

        {/* Terminal Header */}
        <div style={{
          background: '#000000',
          padding: '5px 10px',
          borderBottom: '1px solid #ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px'
        }}>
          {/* Status Info */}
          <div style={{
            display: 'flex',
            gap: '20px',
            fontSize: '11px',
            color: '#ffffff',
            alignItems: 'center'
          }}>
            <span>CHAIN ID: <span style={{ color: '#00ff00' }}>{chainId}</span></span>
            <span>BLOCK: <span style={{ color: '#00ff00' }}>{blocks.length}</span></span>
            <span>TPS: <span style={{ color: '#00ff00' }}>{tps.toFixed(0)}</span></span>
            <span style={{
              width: '6px',
              height: '6px',
              background: '#00ff00',
              borderRadius: '50%',
              animation: 'blink 1s infinite',
              marginTop: '2px'
            }}></span>
            {newAccountAddress && (
              <span style={{ color: '#00ff00' }}>
                WALLET: {newAccountAddress.slice(0, 6)}...{newAccountAddress.slice(-4)}
              </span>
            )}
          </div>

          {/* Hamburger Menu Button (Mobile Only) */}
          <button
            className="hamburger"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '6px 8px'
            }}
            title="Menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>

          {/* Navigation */}
          <div className={`app-nav ${isMobileMenuOpen ? 'open' : ''}`} style={{
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            {[
              { id: 'terminal', label: 'TERMINAL' },
              { id: 'genesis', label: 'GENESIS' },
              { id: 'agents', label: 'AGENTS' },
              { id: 'protocol', label: 'PROTOCOL' },
              { id: 'consensus', label: 'CONSENSUS' },
              { id: 'anomalies', label: 'ANOMALIES' },
              { id: 'archive', label: 'ARCHIVE' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => {
                  console.log('Clicking tab:', t.id);
                  setActiveTab(t.id as any);
                  setIsMobileMenuOpen(false); // Close mobile menu when tab is selected
                }}
                style={{
                  color: activeTab === t.id ? '#00ff00' : '#666666',
                  background: 'transparent',
                  border: 'none',
                  fontSize: '10px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: activeTab === t.id ? 'bold' : 'normal',
                  borderBottom: activeTab === t.id ? '2px solid #00ff00' : '2px solid transparent',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== t.id) {
                    e.currentTarget.style.color = '#00ff00';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== t.id) {
                    e.currentTarget.style.color = '#666666';
                  }
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeTab === 'genesis' && (
            <div style={{ flex: 1, overflow: 'auto' }}>
              {renderGenesisTab()}
            </div>
          )}
          {activeTab === 'agents' && (
            <div style={{ flex: 1, overflow: 'auto' }}>
              {renderAgentsTab()}
            </div>
          )}
          {activeTab === 'protocol' && (
            <div style={{ flex: 1, overflow: 'auto' }}>
              {renderProtocolTab()}
            </div>
          )}
          {activeTab === 'consensus' && (
            <div style={{ flex: 1, overflow: 'auto' }}>
              {renderConsensusTab()}
            </div>
          )}
          {activeTab === 'anomalies' && (
            <div style={{ flex: 1, overflow: 'auto' }}>
              {renderAnomaliesTab()}
            </div>
          )}
          {activeTab === 'terminal' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {renderTerminalTab()}
            </div>
          )}
          {activeTab === 'archive' && (
            <div style={{ flex: 1, overflow: 'auto' }}>
              {renderArchiveTab()}
            </div>
          )}

          {/* Utility Bar - FAUCET & SEND (accessible from all tabs) */}
          <div style={{
            borderTop: '1px solid #00ff00',
            backgroundColor: '#000',
            padding: '10px 20px',
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px'
          }}>
            <span className="utilities-label" style={{ color: '#666', marginRight: '8px' }}>UTILITIES:</span>

            {/* Copy CA button placed next to UTILITIES on the left */}
            <button
              onClick={copyCA}
              style={{
                background: 'transparent',
                border: '1px solid #00ff00',
                color: '#00ff00',
                padding: '6px 10px',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '10px',
                transition: 'all 0.2s',
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00ff00';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#00ff00';
              }}
              aria-label="Copy CA to clipboard"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M16 4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="#00ff00" strokeWidth="1.2" />
                <path d="M8 8h8" stroke="#00ff00" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span style={{ color: '#00ff00' }}>Copy CA</span>
            </button>

            {/* FAUCET/SEND and balance grouped to the right */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px', alignItems: 'center' }}>
              {/* FAUCET Button */}
              <button
                onClick={() => {
                  const newWallet = generateWallet();
                  setAccounts((prev: any[]) => [...prev, { address: newWallet.address, balance: 10 }]);
                  setChatlog((prev: any[]) => [...prev, {
                    from: 'SYSTEM',
                    text: `[FAUCET] New wallet: ${newWallet.address} | Balance: 10 AGENT`,
                    timestamp: Date.now()
                  }]);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #00ff00',
                  color: '#00ff00',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#00ff00';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#00ff00';
                }}
              >
                💧 FAUCET
              </button>

              {/* SEND Button */}
              <button
                onClick={() => {
                  const from = accounts[0]?.address || 'N/A';
                  const to = accounts[1]?.address || generateWallet().address;
                  const amount = 0.1;

                  if (accounts.length === 0) {
                    setChatlog((prev: any[]) => [...prev, {
                      from: 'SYSTEM',
                      text: `[ERROR] No wallets available. Use FAUCET to create one first.`,
                      timestamp: Date.now()
                    }]);
                    return;
                  }

                  // Simple transaction
                  setChatlog((prev: any[]) => [...prev, {
                    from: 'SYSTEM',
                    text: `[SEND] Tx: ${from.slice(0, 10)}...${from.slice(-4)} → ${to.slice(0, 10)}...${to.slice(-4)} | ${amount} AGENT`,
                    timestamp: Date.now()
                  }]);

                  // Add to pending transactions
                  setPendingTxs((prev: any[]) => [...prev, {
                    from,
                    to,
                    amount,
                    timestamp: Date.now(),
                    gasUsed: 21000,
                    gasPrice: baseFee + priorityFee,
                    fee: (21000 * (baseFee + priorityFee)) / 1e9
                  }]);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #00ff00',
                  color: '#00ff00',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '10px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#00ff00';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#00ff00';
                }}
              >
                ⚡ SEND
              </button>

              <span style={{ color: '#666', fontSize: '8px' }}>
                Balance: {accounts[0]?.balance.toFixed(4) || '0.0000'} AGENT | Gas: {baseFee.toFixed(1)} Gwei
              </span>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}











