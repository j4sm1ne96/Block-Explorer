import { Alchemy, Network } from 'alchemy-sdk';
import { useEffect, useState } from 'react';

import './App.css';

// keys in client-side code (remove from production code)
const settings = {
  apiKey: process.env.REACT_APP_ALCHEMY_API_KEY,
  network: Network.ETH_MAINNET,
};

// Alchemy SDK is an umbrella library with several different packages.
const alchemy = new Alchemy(settings);

function App() {
  const [blockNumber, setBlockNumber] = useState();
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingBlockDetails, setLoadingBlockDetails] = useState(false);

  // Fetch latest block number and recent blocks
  useEffect(() => {
    async function getRecentBlocks() {
      try {
        setLoading(true);
        setError(null);
        const latestBlockNum = await alchemy.core.getBlockNumber();
        setBlockNumber(latestBlockNum);
        
        // Fetch last 20 blocks
        const blockPromises = [];
        for (let i = 0; i < 20; i++) {
          blockPromises.push(
            alchemy.core.getBlock(latestBlockNum - i)
          );
        }
        
        const blockData = await Promise.all(blockPromises);
        setBlocks(blockData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching blocks:', err);
      } finally {
        setLoading(false);
      }
    }

    getRecentBlocks();
  }, []);

  // Fetch full block details with transactions when a block is selected
  useEffect(() => {
    if (!selectedBlock || !selectedBlock.number) return;

    async function getBlockDetails() {
      try {
        setLoadingBlockDetails(true);
        setError(null);
        const blockData = await alchemy.core.getBlockWithTransactions(selectedBlock.number);
        setSelectedBlock(blockData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching block details:', err);
      } finally {
        setLoadingBlockDetails(false);
      }
    }

    getBlockDetails();
  }, [selectedBlock?.number]);

  const handleBlockClick = (block) => {
    setSelectedBlock(block);
    setSelectedTransaction(null);
  };

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleBackToBlocks = () => {
    setSelectedBlock(null);
    setSelectedTransaction(null);
  };

  const handleBackToTransactions = () => {
    setSelectedTransaction(null);
  };

  // Transaction details view
  if (selectedTransaction) {
    return (
      <div className="App">
        <div className="container">
          <button className="back-button" onClick={handleBackToTransactions}>
            ← Back to Block
          </button>
          <h1>Transaction Details</h1>
          <div className="details-container">
            <div className="detail-item">
              <strong>Hash:</strong>
              <span className="hash">{selectedTransaction.hash}</span>
            </div>
            <div className="detail-item">
              <strong>From:</strong>
              <span className="address">{selectedTransaction.from}</span>
            </div>
            <div className="detail-item">
              <strong>To:</strong>
              <span className="address">{selectedTransaction.to || 'Contract Creation'}</span>
            </div>
            <div className="detail-item">
              <strong>Value:</strong>
              <span>{selectedTransaction.value ? `${selectedTransaction.value.toString()} wei` : '0 wei'}</span>
            </div>
            <div className="detail-item">
              <strong>Gas Limit:</strong>
              <span>{selectedTransaction.gasLimit?.toString()}</span>
            </div>
            <div className="detail-item">
              <strong>Gas Price:</strong>
              <span>{selectedTransaction.gasPrice ? `${selectedTransaction.gasPrice.toString()} wei` : 'N/A'}</span>
            </div>
            <div className="detail-item">
              <strong>Nonce:</strong>
              <span>{selectedTransaction.nonce}</span>
            </div>
            <div className="detail-item">
              <strong>Block Number:</strong>
              <span>{selectedTransaction.blockNumber}</span>
            </div>
            <div className="detail-item">
              <strong>Transaction Index:</strong>
              <span>{selectedTransaction.transactionIndex}</span>
            </div>
            {selectedTransaction.data && selectedTransaction.data !== '0x' && (
              <div className="detail-item">
                <strong>Data:</strong>
                <span className="data">{selectedTransaction.data}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Block details view
  if (selectedBlock) {
    return (
      <div className="App">
        <div className="container">
          <button className="back-button" onClick={handleBackToBlocks}>
            ← Back to Blocks
          </button>
          <h1>Block Details</h1>
          {loadingBlockDetails ? (
            <div>Loading block details...</div>
          ) : error ? (
            <div className="error">Error: {error}</div>
          ) : (
            <>
          <div className="details-container">
            <div className="detail-item">
              <strong>Block Number:</strong>
              <span>{selectedBlock.number}</span>
            </div>
            <div className="detail-item">
              <strong>Hash:</strong>
              <span className="hash">{selectedBlock.hash}</span>
            </div>
            <div className="detail-item">
              <strong>Parent Hash:</strong>
              <span className="hash">{selectedBlock.parentHash}</span>
            </div>
            <div className="detail-item">
              <strong>Timestamp:</strong>
              <span>{new Date(selectedBlock.timestamp * 1000).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <strong>Gas Limit:</strong>
              <span>{selectedBlock.gasLimit?.toString()}</span>
            </div>
            <div className="detail-item">
              <strong>Gas Used:</strong>
              <span>{selectedBlock.gasUsed?.toString()}</span>
            </div>
            <div className="detail-item">
              <strong>Miner:</strong>
              <span className="address">{selectedBlock.miner}</span>
            </div>
            <div className="detail-item">
              <strong>Transaction Count:</strong>
              <span>{selectedBlock.transactions?.length || 0}</span>
            </div>
          </div>

          {selectedBlock.transactions && selectedBlock.transactions.length > 0 && (
            <div className="transactions-section">
              <h2>Transactions ({selectedBlock.transactions.length})</h2>
              <div className="transactions-list">
                {selectedBlock.transactions.map((tx, index) => (
                  <div
                    key={tx.hash || index}
                    className="transaction-item"
                    onClick={() => handleTransactionClick(tx)}
                  >
                    <div className="transaction-header">
                      <span className="transaction-hash">{tx.hash}</span>
                    </div>
                    <div className="transaction-details">
                      <div>
                        <strong>From:</strong> {tx.from?.substring(0, 10)}...
                      </div>
                      <div>
                        <strong>To:</strong> {tx.to ? `${tx.to.substring(0, 10)}...` : 'Contract Creation'}
                      </div>
                      <div>
                        <strong>Value:</strong> {tx.value ? `${tx.value.toString()} wei` : '0 wei'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    );
  }

  // Blocks list view
  return (
    <div className="App">
      <div className="container">
        {error ? (
          <div className="error">Error: {error}</div>
        ) : (
          <>
            <h1>Recent Blocks</h1>
            {loading ? (
              <div>Loading blocks...</div>
            ) : (
              <div className="blocks-list">
                {blocks.map((block) => (
                  <div
                    key={block.number}
                    className="block-item"
                    onClick={() => handleBlockClick(block)}
                  >
                    <div className="block-header">
                      <span className="block-number">Block #{block.number}</span>
                      <span className="block-timestamp">
                        {new Date(block.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                    <div className="block-details">
                      <div>
                        <strong>Hash:</strong> {block.hash?.substring(0, 20)}...
                      </div>
                      <div>
                        <strong>Transactions:</strong> {block.transactions?.length || 0}
                      </div>
                      <div>
                        <strong>Gas Used:</strong> {block.gasUsed?.toString() || 'N/A'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
