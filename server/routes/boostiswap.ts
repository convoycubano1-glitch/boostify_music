import { Router } from "express";
import { db } from "../db";
import { tokenizedSongs, swapPairs, liquidityPools, liquidityPositions, swapHistory, users } from "../db/schema";
import { desc, eq, and } from "drizzle-orm";

const router = Router();

// AMM Formula: x * y = k (Constant Product)
function calculateSwapAmount(inputAmount: number, inputReserve: number, outputReserve: number, feeBps: number = 5) {
  const fee = (inputAmount * feeBps) / 10000;
  const inputAfterFee = inputAmount - fee;
  const outputAmount = (inputAfterFee * outputReserve) / (inputReserve + inputAfterFee);
  const priceImpact = ((inputAmount - outputAmount) / inputAmount) * 100;
  return { outputAmount: Math.floor(outputAmount), fee, priceImpact };
}

/**
 * Obtener todas las canciones tokenizadas para el marketplace
 */
router.get("/tokenized-songs", async (req, res) => {
  try {
    console.log("📊 [BOOSTISWAP] Obteniendo canciones tokenizadas...");
    
    const songs = await db.select().from(tokenizedSongs)
      .where((song) => song.isActive === true)
      .orderBy(desc(tokenizedSongs.createdAt));
    
    console.log(`✅ [BOOSTISWAP] Se encontraron ${songs.length} canciones tokenizadas`);
    
    // Format response for marketplace - fetch artist names
    const formattedSongs = await Promise.all(
      songs.map(async (song) => {
        let artistName = song.songName;
        try {
          if (song.artistId) {
            const artist = await db.select({ name: users.artistName })
              .from(users)
              .where(eq(users.id, song.artistId))
              .limit(1);
            if (artist.length > 0 && artist[0].name) {
              artistName = artist[0].name;
            }
          }
        } catch (err) {
          console.error("Error fetching artist:", err);
        }

        return {
          id: song.id,
          artistId: song.artistId,
          songName: song.songName,
          artist: artistName,
          tokenSymbol: song.tokenSymbol,
          pricePerTokenUsd: parseFloat(song.pricePerTokenUsd),
          pricePerTokenEth: song.pricePerTokenEth ? parseFloat(song.pricePerTokenEth) : 0.005,
          totalSupply: song.totalSupply,
          availableSupply: song.availableSupply,
          volume24h: Math.floor(Math.random() * 50000) + 10000,
          holders: Math.floor(Math.random() * 1000) + 100,
          imageUrl: song.imageUrl || "",
          description: song.description || "",
          change24h: Math.random() * 30 - 5,
          contractAddress: song.contractAddress,
          tokenId: song.tokenId,
          blockchainTokenId: song.tokenId,
          benefits: song.benefits || []
        };
      })
    );
    
    res.json(formattedSongs);
  } catch (error) {
    console.error("❌ Error getting tokenized songs:", error);
    res.status(500).json({ error: "Error getting tokenized songs" });
  }
});

/**
 * Obtener todos los pares de trading activos
 */
router.get("/pairs", async (req, res) => {
  try {
    console.log("📊 [BOOSTISWAP] Obteniendo pares de trading...");
    const pairs = await db
      .select()
      .from(swapPairs)
      .where(eq(swapPairs.isActive, true))
      .orderBy(desc(swapPairs.volume24h));
    
    console.log(`✅ Se encontraron ${pairs.length} pares activos`);
    res.json(pairs);
  } catch (error) {
    console.error("❌ Error getting pairs:", error);
    res.status(500).json({ error: "Error getting pairs" });
  }
});

/**
 * Crear nuevo par de trading
 */
router.post("/pairs", async (req, res) => {
  try {
    const { token1Id, token2Id, pairAddress } = req.body;
    
    if (!token1Id || !token2Id || !pairAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const pair = await db
      .insert(swapPairs)
      .values({
        token1Id,
        token2Id,
        pairAddress,
        reserve1: "0",
        reserve2: "0",
        volume24h: "0",
        feeTier: 5,
      })
      .returning();
    
    console.log(`✅ Par creado: ${pair[0].id}`);
    res.status(201).json(pair[0]);
  } catch (error) {
    console.error("❌ Error creating pair:", error);
    res.status(500).json({ error: "Error creating pair" });
  }
});

/**
 * Obtener todos los pools de liquidez activos
 */
router.get("/pools", async (req, res) => {
  try {
    console.log("📊 [BOOSTISWAP] Obteniendo pools de liquidez...");
    const pools = await db
      .select()
      .from(liquidityPools)
      .where(eq(liquidityPools.isActive, true))
      .orderBy(desc(liquidityPools.totalShares));
    
    console.log(`✅ Se encontraron ${pools.length} pools`);
    res.json(pools);
  } catch (error) {
    console.error("❌ Error getting pools:", error);
    res.status(500).json({ error: "Error getting pools" });
  }
});

/**
 * Crear o inicializar pool de liquidez
 */
router.post("/pools", async (req, res) => {
  try {
    const { pairId, reserve1, reserve2 } = req.body;
    
    if (!pairId || !reserve1 || !reserve2) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const pool = await db
      .insert(liquidityPools)
      .values({
        pairId,
        reserve1: reserve1.toString(),
        reserve2: reserve2.toString(),
        totalShares: "1000000000000000000", // 1e18 for initial liquidity
        apy: "14.2", // Default APY
      })
      .returning();
    
    console.log(`✅ Pool creado: ${pool[0].id}`);
    res.status(201).json(pool[0]);
  } catch (error) {
    console.error("❌ Error creating pool:", error);
    res.status(500).json({ error: "Error creating pool" });
  }
});

/**
 * Calcular output de swap (sin ejecutar transacción)
 */
router.get("/swap/quote", async (req, res) => {
  try {
    const { pairId, inputAmount } = req.query;
    
    if (!pairId || !inputAmount) {
      return res.status(400).json({ error: "Missing pairId or inputAmount" });
    }
    
    const pair = await db
      .select()
      .from(swapPairs)
      .where(eq(swapPairs.id, parseInt(pairId as string)))
      .limit(1);
    
    if (!pair.length) {
      return res.status(404).json({ error: "Pair not found" });
    }
    
    const inputReserve = parseFloat(pair[0].reserve1);
    const outputReserve = parseFloat(pair[0].reserve2);
    const input = parseInt(inputAmount as string);
    
    const { outputAmount, fee, priceImpact } = calculateSwapAmount(input, inputReserve, outputReserve);
    
    console.log(`💹 Quote: Input=${input}, Output=${outputAmount}, Fee=${fee}, Impact=${priceImpact.toFixed(2)}%`);
    
    res.json({
      inputAmount: input,
      outputAmount,
      fee: Math.floor(fee),
      priceImpact: priceImpact.toFixed(2),
      platform_fee_usd: (fee * 0.05).toFixed(2), // 5% platform fee
      lp_fee_usd: (fee * 0.95).toFixed(2)  // 95% to LP
    });
  } catch (error) {
    console.error("❌ Error calculating quote:", error);
    res.status(500).json({ error: "Error calculating quote" });
  }
});

/**
 * Ejecutar swap entre dos tokens
 */
router.post("/swap", async (req, res) => {
  try {
    const { userId, pairId, inputAmount, minOutputAmount, walletAddress, tokenInId, tokenOutId } = req.body;
    
    if (!pairId || !inputAmount || !walletAddress || !tokenInId || !tokenOutId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Get pair and calculate output
    const pair = await db
      .select()
      .from(swapPairs)
      .where(eq(swapPairs.id, pairId))
      .limit(1);
    
    if (!pair.length) {
      return res.status(404).json({ error: "Pair not found" });
    }
    
    const inputReserve = parseFloat(pair[0].reserve1);
    const outputReserve = parseFloat(pair[0].reserve2);
    const { outputAmount, fee, priceImpact } = calculateSwapAmount(inputAmount, inputReserve, outputReserve);
    
    if (outputAmount < minOutputAmount) {
      return res.status(400).json({
        error: "Slippage exceeded",
        expected: outputAmount,
        minimum: minOutputAmount
      });
    }
    
    // Record swap in history
    const platformFee = (fee * 0.05);
    const lpFee = (fee * 0.95);
    
    const swap = await db
      .insert(swapHistory)
      .values({
        userId: userId || null,
        pairId,
        walletAddress,
        tokenInId,
        tokenOutId,
        amountIn: inputAmount.toString(),
        amountOut: outputAmount.toString(),
        priceImpact: priceImpact.toString(),
        platformFeeUsd: platformFee.toString(),
        lpFeeUsd: lpFee.toString(),
        status: "confirmed"
      })
      .returning();
    
    // Update pair volume
    await db
      .update(swapPairs)
      .set({
        volume24h: (parseFloat(pair[0].volume24h) + inputAmount).toString()
      })
      .where(eq(swapPairs.id, pairId));
    
    console.log(`✅ Swap ejecutado: ${inputAmount} → ${outputAmount}`);
    
    res.json({
      success: true,
      swap: {
        id: swap[0].id,
        tokenIn: tokenInId,
        tokenOut: tokenOutId,
        amountIn: inputAmount,
        amountOut: outputAmount,
        priceImpact: priceImpact.toFixed(2),
        platformFee: platformFee.toFixed(2),
        lpFee: lpFee.toFixed(2),
        transactionHash: swap[0].transactionHash
      }
    });
  } catch (error) {
    console.error("❌ Error executing swap:", error);
    res.status(500).json({ error: "Error executing swap" });
  }
});

/**
 * Agregar liquidez a un pool
 */
router.post("/liquidity/add", async (req, res) => {
  try {
    const { userId, poolId, amount1, amount2, walletAddress } = req.body;
    
    if (!userId || !poolId || !amount1 || !amount2 || !walletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    // Get pool
    const pool = await db
      .select()
      .from(liquidityPools)
      .where(eq(liquidityPools.id, poolId))
      .limit(1);
    
    if (!pool.length) {
      return res.status(404).json({ error: "Pool not found" });
    }
    
    // Calculate LP tokens to mint
    const totalSupply = parseFloat(pool[0].totalShares);
    const lpTokens = Math.sqrt(amount1 * amount2);
    
    const position = await db
      .insert(liquidityPositions)
      .values({
        userId,
        poolId,
        walletAddress,
        lpTokensHeld: lpTokens.toString(),
        amount1Deposited: amount1.toString(),
        amount2Deposited: amount2.toString(),
        status: "active"
      })
      .returning();
    
    // Update pool
    await db
      .update(liquidityPools)
      .set({
        reserve1: (parseFloat(pool[0].reserve1) + amount1).toString(),
        reserve2: (parseFloat(pool[0].reserve2) + amount2).toString(),
        totalShares: (totalSupply + lpTokens).toString()
      })
      .where(eq(liquidityPools.id, poolId));
    
    console.log(`✅ Liquidez agregada: ${amount1} + ${amount2}, LP tokens: ${lpTokens}`);
    
    res.status(201).json({
      success: true,
      position: {
        id: position[0].id,
        lpTokensReceived: lpTokens,
        amount1Deposited: amount1,
        amount2Deposited: amount2,
        status: position[0].status
      }
    });
  } catch (error) {
    console.error("❌ Error adding liquidity:", error);
    res.status(500).json({ error: "Error adding liquidity" });
  }
});

/**
 * Obtener posiciones de liquidez del usuario
 */
router.get("/liquidity/positions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`📊 Obteniendo posiciones del usuario ${userId}...`);
    
    const positions = await db
      .select()
      .from(liquidityPositions)
      .where(eq(liquidityPositions.userId, parseInt(userId)))
      .orderBy(desc(liquidityPositions.createdAt));
    
    console.log(`✅ Se encontraron ${positions.length} posiciones`);
    res.json(positions);
  } catch (error) {
    console.error("❌ Error getting positions:", error);
    res.status(500).json({ error: "Error getting positions" });
  }
});

/**
 * Obtener historial de transacciones (swaps) del usuario
 */
router.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`📊 Obteniendo transacciones del usuario ${userId}...`);
    
    const transactions = await db
      .select()
      .from(swapHistory)
      .where(eq(swapHistory.userId, parseInt(userId)))
      .orderBy(desc(swapHistory.createdAt));
    
    console.log(`✅ Se encontraron ${transactions.length} transacciones`);
    res.json(transactions);
  } catch (error) {
    console.error("❌ Error getting transactions:", error);
    res.status(500).json({ error: "Error getting transactions" });
  }
});

/**
 * Obtener historial de swaps por wallet (sin usuario registrado)
 */
router.get("/transactions/wallet/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    console.log(`📊 Obteniendo transacciones del wallet ${walletAddress}...`);
    
    const transactions = await db
      .select()
      .from(swapHistory)
      .where(eq(swapHistory.walletAddress, walletAddress))
      .orderBy(desc(swapHistory.createdAt));
    
    console.log(`✅ Se encontraron ${transactions.length} transacciones`);
    res.json(transactions);
  } catch (error) {
    console.error("❌ Error getting transactions:", error);
    res.status(500).json({ error: "Error getting transactions" });
  }
});

export default router;
