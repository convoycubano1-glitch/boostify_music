import { Router } from "express";
import { db } from "../db";
import { tokenizedSongs } from "../db/schema";
import { users } from "../db/schema";
import { desc, eq } from "drizzle-orm";

const router = Router();

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
 * Obtener todos los pares de trading
 */
router.get("/pairs", async (req, res) => {
  try {
    const pairs = [];
    res.json(pairs);
  } catch (error) {
    console.error("Error getting pairs:", error);
    res.status(500).json({ error: "Error getting pairs" });
  }
});

/**
 * Crear nuevo par
 */
router.post("/pairs", async (req, res) => {
  try {
    const { token1Id, token2Id } = req.body;
    const pair = { id: 1, token1Id, token2Id, createdAt: new Date() };
    res.status(201).json(pair);
  } catch (error) {
    res.status(500).json({ error: "Error creating pair" });
  }
});

/**
 * Obtener pools con liquidez
 */
router.get("/pools", async (req, res) => {
  try {
    const pools = [];
    res.json(pools);
  } catch (error) {
    res.status(500).json({ error: "Error getting pools" });
  }
});

/**
 * Crear pool de liquidez
 */
router.post("/pools", async (req, res) => {
  try {
    const { pairId, token1Amount, token2Amount, userId } = req.body;
    const pool = { id: 1, pairId, token1Reserve: token1Amount, token2Reserve: token2Amount };
    res.status(201).json(pool);
  } catch (error) {
    res.status(500).json({ error: "Error creating pool" });
  }
});

/**
 * Calcular output de swap (sin ejecutar)
 */
router.get("/swap/quote", async (req, res) => {
  try {
    const { pairId, inputAmount } = req.query;
    const output = 0; // Placeholder
    const priceImpact = 0;
    res.json({ output, priceImpact });
  } catch (error) {
    res.status(500).json({ error: "Error calculating quote" });
  }
});

/**
 * Ejecutar swap
 */
router.post("/swap", async (req, res) => {
  try {
    const { userId, pairId, inputAmount, minOutputAmount } = req.body;
    const swap = { id: 1, userId, pairId, inputAmount, outputAmount: 0 };
    res.status(201).json(swap);
  } catch (error) {
    res.status(500).json({ error: "Error executing swap" });
  }
});

/**
 * Agregar liquidez
 */
router.post("/liquidity/add", async (req, res) => {
  try {
    const { userId, pairId, token1Amount, token2Amount } = req.body;
    const position = { id: 1, userId, pairId, liquidityShares: 0 };
    res.status(201).json(position);
  } catch (error) {
    res.status(500).json({ error: "Error adding liquidity" });
  }
});

/**
 * Mis posiciones de liquidez
 */
router.get("/liquidity/positions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const positions = [];
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: "Error getting positions" });
  }
});

/**
 * Historial de transacciones del usuario
 */
router.get("/transactions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = [];
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Error getting transactions" });
  }
});

export default router;
