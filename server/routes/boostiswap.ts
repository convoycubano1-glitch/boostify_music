import { Router } from "express";
import { db } from "../db";
import { tokenizedSongs, swapPairs, liquidityPools, liquidityPositions, swapHistory, users } from "../db/schema";
import { desc, eq, and } from "drizzle-orm";
import { calculateDEXFees, BOOSTISWAP_FEE_PERCENTAGE } from "../utils/web3-contracts";

const router = Router();

/**
 * Calcula el monto de salida de un swap con 5% DEX fee para Boostify
 * Fórmula AMM: x * y = k (Constant Product)
 * Fee: 5% para Boostify
 */
function calculateSwapAmount(inputAmount: number, inputReserve: number, outputReserve: number) {
  // 5% fee para Boostify
  const boostifyFeeAmount = (inputAmount * BOOSTISWAP_FEE_PERCENTAGE) / 100;
  const inputAfterFee = inputAmount - boostifyFeeAmount;
  
  // AMM calculation con fee aplicado
  const outputAmount = (inputAfterFee * outputReserve) / (inputReserve + inputAfterFee);
  const priceImpact = ((inputAmount - outputAmount) / inputAmount) * 100;
  
  return { 
    outputAmount: Math.floor(outputAmount), 
    boostifyFee: boostifyFeeAmount,
    priceImpact 
  };
}

/**
 * Obtener todas las canciones tokenizadas para el marketplace
 * Combina datos de BD (artistas generados) + datos estáticos (20 artistas profesionales)
 */
router.get("/tokenized-songs", async (req, res) => {
  try {
    console.log("📊 [BOOSTISWAP] Obteniendo canciones tokenizadas...");
    
    const songs = await db.select().from(tokenizedSongs)
      .where((song) => song.isActive === true)
      .orderBy(desc(tokenizedSongs.createdAt));
    
    console.log(`✅ [BOOSTISWAP] Se encontraron ${songs.length} canciones tokenizadas de artistas generados`);
    
    // Format response for marketplace - fetch artist names and profile images
    const formattedSongs = await Promise.all(
      songs.map(async (song) => {
        let artistName = song.songName;
        let artistProfileImage = song.imageUrl || "";
        let artistSlug = "";
        
        try {
          if (song.artistId) {
            const artist = await db.select({ 
              name: users.artistName,
              profileImage: users.profileImage,
              slug: users.slug
            })
              .from(users)
              .where(eq(users.id, song.artistId))
              .limit(1);
            
            if (artist.length > 0) {
              if (artist[0].name) artistName = artist[0].name;
              if (artist[0].profileImage) artistProfileImage = artist[0].profileImage;
              if (artist[0].slug) artistSlug = artist[0].slug;
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
          imageUrl: artistProfileImage || song.imageUrl || "",
          description: song.description || "",
          change24h: Math.random() * 30 - 5,
          contractAddress: song.contractAddress,
          tokenId: song.tokenId,
          blockchainTokenId: song.tokenId,
          benefits: song.benefits || [],
          artistSlug: artistSlug,
          isGenerated: true
        };
      })
    );
    
    // Si no hay canciones en BD, agregar datos estáticos de los 20 artistas profesionales
    if (formattedSongs.length === 0) {
      console.log("📚 Agregando 20 artistas profesionales estáticos como fallback...");
      const staticArtists = [
        { id: 1, artist: "Luna Echo", tokenSymbol: "LUNA", pricePerTokenUsd: 2.45, description: "A haunting synthwave track with ethereal vocals", imageUrl: "/artist-images/luna_echo_-_female_pop_singer.png" },
        { id: 2, artist: "Urban Flow", tokenSymbol: "URBAN", pricePerTokenUsd: 3.15, description: "High-energy hip-hop with infectious beats", imageUrl: "/artist-images/urban_flow_-_hip-hop_artist.png" },
        { id: 3, artist: "Electric Dreams", tokenSymbol: "ELDREAM", pricePerTokenUsd: 4.22, description: "Electropop sensation breaking charts worldwide", imageUrl: "/artist-images/electric_dreams_-_electronic_artist.png" },
        { id: 4, artist: "Soul Harmony", tokenSymbol: "SOUL", pricePerTokenUsd: 2.88, description: "Deep R&B with timeless soul vibes", imageUrl: "/artist-images/soul_harmony_-_r&b_artist.png" },
        { id: 5, artist: "Maya Rivers", tokenSymbol: "MAYA", pricePerTokenUsd: 1.99, description: "Indie folk masterpiece with acoustic instrumentation", imageUrl: "/artist-images/maya_rivers_-_indie_folk.png" },
        { id: 6, artist: "Jah Vibes", tokenSymbol: "JAH", pricePerTokenUsd: 2.15, description: "Relaxing reggae vibes for the soul", imageUrl: "/artist-images/jah_vibes_-_reggae_artist.png" },
        { id: 7, artist: "David Chen", tokenSymbol: "CHEN", pricePerTokenUsd: 5.50, description: "A virtuosic classical composition", imageUrl: "/artist-images/david_chen_-_classical_pianist.png" },
        { id: 8, artist: "Sophia Kim", tokenSymbol: "SOPHIA", pricePerTokenUsd: 3.80, description: "Chart-topping K-pop sensation", imageUrl: "/artist-images/sophia_kim_-_k-pop_star.png" },
        { id: 9, artist: "Marcus Stone", tokenSymbol: "MARCUS", pricePerTokenUsd: 4.15, description: "Smooth jazz saxophone performance", imageUrl: "/artist-images/marcus_stone_-_jazz_saxophonist.png" },
        { id: 10, artist: "Isabella Santos", tokenSymbol: "BELLA", pricePerTokenUsd: 3.45, description: "Hot reggaeton track with infectious rhythm", imageUrl: "/artist-images/isabella_santos_-_reggaeton.png" },
        { id: 11, artist: "Luke Bradley", tokenSymbol: "LUKE", pricePerTokenUsd: 2.65, description: "Classic country ballad", imageUrl: "/artist-images/luke_bradley_-_country_artist.png" },
        { id: 12, artist: "Aria Nova", tokenSymbol: "ARIA", pricePerTokenUsd: 2.20, description: "Ethereal ambient electronic soundscape", imageUrl: "/artist-images/aria_nova_-_ambient_electronic.png" },
        { id: 13, artist: "Alex Thunder", tokenSymbol: "ALEX", pricePerTokenUsd: 3.55, description: "Heavy trap production masterpiece", imageUrl: "/artist-images/alex_thunder_-_trap_producer.png" },
        { id: 14, artist: "Victoria Cross", tokenSymbol: "VICTORIA", pricePerTokenUsd: 6.10, description: "Classical opera performance", imageUrl: "/artist-images/victoria_cross_-_opera_singer.png" },
        { id: 15, artist: "Prince Diesel", tokenSymbol: "DIESEL", pricePerTokenUsd: 3.90, description: "Funky rhythmic groove", imageUrl: "/artist-images/prince_diesel_-_funk_artist.png" },
        { id: 16, artist: "Ryan Phoenix", tokenSymbol: "RYAN", pricePerTokenUsd: 3.25, description: "Indie rock anthem", imageUrl: "/artist-images/ryan_phoenix_-_indie_rock.png" },
        { id: 17, artist: "Pablo Fuego", tokenSymbol: "PABLO", pricePerTokenUsd: 2.99, description: "Energetic Latin music", imageUrl: "/artist-images/pablo_fuego_-_latin_artist.png" },
        { id: 18, artist: "Emma White", tokenSymbol: "EMMA", pricePerTokenUsd: 3.55, description: "Catchy pop hit", imageUrl: "/artist-images/emma_white_-_pop_princess.png" },
        { id: 19, artist: "Chris Void", tokenSymbol: "VOID", pricePerTokenUsd: 4.05, description: "Massive dubstep bass drop", imageUrl: "/artist-images/chris_void_-_dubstep_producer.png" },
        { id: 20, artist: "James Grant", tokenSymbol: "JAMES", pricePerTokenUsd: 3.35, description: "Soulful R&B ballad", imageUrl: "/artist-images/james_grant_-_soul_singer.png" }
      ];

      const staticFormattedSongs = staticArtists.map((artist, idx) => ({
        id: 100 + idx,
        artistId: idx + 1,
        songName: `${artist.artist} - Main Single`,
        artist: artist.artist,
        tokenSymbol: artist.tokenSymbol,
        pricePerTokenUsd: artist.pricePerTokenUsd,
        pricePerTokenEth: artist.pricePerTokenUsd / 2000, // Approximate conversion
        totalSupply: 10000 + (idx * 1000),
        availableSupply: 3500 + (idx * 500),
        volume24h: Math.floor(Math.random() * 50000) + 10000,
        holders: Math.floor(Math.random() * 1000) + 100,
        imageUrl: artist.imageUrl,
        description: artist.description,
        change24h: Math.random() * 30 - 5,
        contractAddress: `0x${Math.random().toString(16).substring(2).padEnd(40, '0')}`,
        tokenId: 1000 + idx,
        blockchainTokenId: 1000 + idx,
        benefits: ['Exclusive Access', 'Revenue Share', 'Creator Rights'],
        artistSlug: artist.artist.toLowerCase().replace(/\s+/g, '-'),
        isGenerated: false
      }));

      formattedSongs.push(...staticFormattedSongs);
      console.log(`✅ Agregados ${staticFormattedSongs.length} artistas estáticos. Total: ${formattedSongs.length}`);
    }

    res.json(formattedSongs);
  } catch (error) {
    console.error("❌ Error getting tokenized songs:", error);
    res.status(500).json({ error: "Error getting tokenized songs" });
  }
});

/**
 * Alias: Obtener tokens de artistas (mismo que tokenized-songs)
 */
router.get("/artist-tokens", async (req, res) => {
  try {
    console.log("📊 [BOOSTISWAP] Obteniendo artist tokens (alias de tokenized-songs)...");
    
    const songs = await db.select().from(tokenizedSongs)
      .where((song) => song.isActive === true)
      .orderBy(desc(tokenizedSongs.createdAt));
    
    // Format as artist tokens for marketplace
    const artistTokens = await Promise.all(
      songs.map(async (song) => {
        let artistName = song.songName;
        let artistProfileImage = song.imageUrl || "";
        
        try {
          if (song.artistId) {
            const artist = await db.select({ 
              name: users.artistName,
              profileImage: users.profileImage
            })
              .from(users)
              .where(eq(users.id, song.artistId))
              .limit(1);
            
            if (artist.length > 0) {
              if (artist[0].name) artistName = artist[0].name;
              if (artist[0].profileImage) artistProfileImage = artist[0].profileImage;
            }
          }
        } catch (err) {
          console.error("Error fetching artist:", err);
        }

        return {
          id: song.id,
          name: artistName,
          tokenSymbol: song.tokenSymbol,
          pricePerTokenUsd: parseFloat(song.pricePerTokenUsd),
          totalSupply: song.totalSupply,
          availableSupply: song.availableSupply,
          volume24h: Math.floor(Math.random() * 100000) + 5000,
          holders: Math.floor(Math.random() * 1000) + 50,
          imageUrl: artistProfileImage || song.imageUrl,
          description: song.description || `${artistName} Artist Token`,
          change24h: Math.random() * 30 - 5
        };
      })
    );
    
    console.log(`✅ [BOOSTISWAP] ${artistTokens.length} artist tokens encontrados`);
    res.json(artistTokens);
  } catch (error) {
    console.error("❌ Error getting artist tokens:", error);
    res.status(500).json({ error: "Error getting artist tokens" });
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
    
    // Calcular fees usando la función centralizada
    const feeCalculation = calculateDEXFees(inputAmount);
    
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
        platformFeeUsd: feeCalculation.boostifyFee.toString(),  // 5% para Boostify
        lpFeeUsd: feeCalculation.lpFee.toString(),  // 0.25% para LP providers
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
        platformFee: feeCalculation.boostifyFee.toFixed(2),  // 5% para Boostify desarrollo
        lpFee: feeCalculation.lpFee.toFixed(2),  // 0.25% para LP providers
        feeBreakdown: {
          boostifyDevelopment: `${BOOSTISWAP_FEE_PERCENTAGE}%`,
          liquidityProviders: "0.25%",
          dao: "0.05%"
        }
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
