import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileCode, Copy, ExternalLink, CheckCircle, Shield, Clock, DollarSign, Users } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

// Sample contract visualizer component
const SmartContractVisualizer = () => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('simplified');

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simplifiedContractView = (
    <div className="rounded-lg bg-gray-900 p-6 text-sm text-gray-300 font-mono">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <FileCode className="h-5 w-5 text-orange-500" />
          <span className="text-orange-500 font-semibold">MusicToken.sol</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCopy} 
            className="p-1 rounded hover:bg-gray-800 transition-colors"
            aria-label="Copy contract code"
          >
            {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
          </button>
          <a 
            href="#" 
            className="p-1 rounded hover:bg-gray-800 transition-colors"
            aria-label="View on Etherscan"
          >
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </a>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-3 rounded bg-gray-800/50 border border-gray-700">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-green-400">Ownership & Rights</h4>
              <p className="text-gray-400 text-xs mt-1">
                Ensures you retain full copyright ownership while granting token holders specific rights defined in the terms.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded bg-gray-800/50 border border-gray-700">
          <div className="flex items-start gap-2">
            <DollarSign className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-400">Royalty System</h4>
              <p className="text-gray-400 text-xs mt-1">
                Automatically splits 15% of secondary sales between you (10%) and token holders (5%) through ERC-2981.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded bg-gray-800/50 border border-gray-700">
          <div className="flex items-start gap-2">
            <Clock className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-400">Time-based Access</h4>
              <p className="text-gray-400 text-xs mt-1">
                Token grants early access to your new releases and exclusive content for a specified time period.
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded bg-gray-800/50 border border-gray-700">
          <div className="flex items-start gap-2">
            <Users className="h-5 w-5 text-purple-500 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-purple-400">Community Governance</h4>
              <p className="text-gray-400 text-xs mt-1">
                Token holders can participate in voting on certain aspects of your music career decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const technicalContractView = (
    <div className="rounded-lg bg-gray-900 p-6 text-sm text-gray-300 font-mono max-h-96 overflow-y-auto">
      <pre className="text-xs">
        <code>
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract MusicToken is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, ERC2981 {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;
    
    // Music metadata
    string public artistName;
    string public musicTitle;
    string public musicIPFSHash;
    uint256 public releaseDate;
    uint256 public maxSupply;
    uint256 public price;
    
    // Royalty percentage (in basis points, 100 = 1%)
    uint96 private constant ARTIST_ROYALTY = 1000; // 10%
    uint96 private constant HOLDER_ROYALTY = 500;  // 5%
    
    // Events
    event TokenMinted(address indexed to, uint256 indexed tokenId);
    event RoyaltyPaid(address indexed artist, uint256 amount);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _artistName,
        string memory _musicTitle,
        string memory _musicIPFSHash,
        uint256 _maxSupply,
        uint256 _price
    ) ERC721(_name, _symbol) {
        artistName = _artistName;
        musicTitle = _musicTitle;
        musicIPFSHash = _musicIPFSHash;
        releaseDate = block.timestamp;
        maxSupply = _maxSupply;
        price = _price;
        
        // Set default royalty
        _setDefaultRoyalty(msg.sender, ARTIST_ROYALTY);
    }

    function mintToken(address to) public payable returns (uint256) {
        require(_tokenIdCounter.current() < maxSupply, "Max supply reached");
        require(msg.value >= price, "Insufficient payment");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        
        // Set token URI to music metadata
        _setTokenURI(tokenId, musicIPFSHash);
        
        emit TokenMinted(to, tokenId);
        
        return tokenId;
    }

    // ERC165 interface support
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // Override required functions
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}`}
        </code>
      </pre>
    </div>
  );

  return (
    <section className="py-20 bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-3 py-1">
            SMART CONTRACT
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your <span className="text-orange-500">musical rights</span> in code
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            This is a simplified view of the smart contract that powers your music tokenization. It defines how your music rights are managed, royalties are distributed, and what special features token holders receive.
          </p>

          {/* Tabs */}
          <div className="flex justify-center gap-4 mb-8">
            <Button 
              variant={activeTab === 'simplified' ? 'default' : 'outline'}
              onClick={() => setActiveTab('simplified')}
              className={activeTab === 'simplified' ? 'bg-orange-500 hover:bg-orange-600' : 'border-gray-700 hover:bg-gray-800'}
            >
              Simplified View
            </Button>
            <Button 
              variant={activeTab === 'technical' ? 'default' : 'outline'}
              onClick={() => setActiveTab('technical')}
              className={activeTab === 'technical' ? 'bg-orange-500 hover:bg-orange-600' : 'border-gray-700 hover:bg-gray-800'}
            >
              Technical View
            </Button>
          </div>
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {activeTab === 'simplified' ? simplifiedContractView : technicalContractView}
        </motion.div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Our smart contracts are audited by leading security firms and designed to provide maximum protection for both artists and token holders.
          </p>
          <Button className="bg-orange-500 hover:bg-orange-600">Learn More About Smart Contracts</Button>
        </div>
      </div>
    </section>
  );
};

export default SmartContractVisualizer;