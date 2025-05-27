const express = require('express');
const cors = require('cors');
const { Connection, PublicKey } = require('@solana/web3.js');
const DLMM = require('@meteora-ag/dlmm');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

const connection = new Connection('https://api.mainnet-beta.solana.com');

const POOL_ADDRESSES = [
  new PublicKey('3ehZiiyNZC7MReXF1sovr6LUJZ5bT9TZCUEdfwJKXnZQ')
];

app.get('/api/portfolio/:wallet', async (req, res) => {
  const { wallet } = req.params;
  try {
    const walletPubkey = new PublicKey(wallet);
    const allPositions = [];

    for (const poolAddress of POOL_ADDRESSES) {
      try {
        const dlmmPool = await DLMM.create(connection, poolAddress);
        const userPositions = await dlmmPool.getUserPositions(walletPubkey);
        const currentPrice = dlmmPool.getCurrentPrice();

        for (const pos of userPositions) {
          const isClosed = pos.liquidity === 0;
          const size = pos.size || 0;
          const entryPrice = pos.entryPrice;
          const exitPrice = isClosed ? pos.exitPrice : null;
          const priceNow = isClosed ? exitPrice : currentPrice;
          const pnl = (priceNow - entryPrice) * size;

          allPositions.push({
            pair: pos.tokenPair || 'Unknown',
            entryPrice,
            exitPrice,
            currentPrice: priceNow,
            size,
            closed: isClosed,
            pnl
          });
        }
      } catch (innerErr) {
        console.warn(`Failed to load positions from pool ${poolAddress.toBase58()}:`, innerErr);
      }
    }

    const closedPositions = allPositions.filter(pos => pos.closed);
    const chart = {
      labels: closedPositions.map((_, idx) => `Closed #${idx + 1}`),
      data: closedPositions.map(pos => pos.pnl)
    };

    res.json({ positions: allPositions, chart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch real DLMM portfolio data.' });
  }
});

app.listen(PORT, () => {
  console.log(`Meteora Portfolio API running at http://localhost:${PORT}`);
});