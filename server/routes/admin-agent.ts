import { Router, Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// Simple mock analysis since we don't have real transaction data yet
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { days = "30" } = req.body;
    const daysNum = parseInt(days as string);

    // Mock data for now - in production this would come from database
    const mockMetrics = {
      totalRevenue: "15,250.00",
      totalExpenses: "3,450.00",
      netProfit: "11,800.00",
      completionRate: "94.5",
      transactionCount: 47
    };

    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiKey) {
      // Return mock analysis without Gemini
      return res.json({
        success: true,
        analysis: `**Financial Health Score**
85/100 - Strong performance

**Key Insights**
- Revenue is up 15% this period
- Expense ratio is healthy at 22.6%
- Payment completion rate exceeds industry average

**Revenue Trends**
Consistent growth trajectory with subscription revenue as main driver.

**Cost Optimization**
Consider API costs optimization - potential 10-15% savings available.

**Growth Opportunities**
1. Expand enterprise tier offerings
2. Increase marketing automation
3. Develop strategic partnerships

**Risk Alerts**
No critical alerts detected.

**Action Items**
1. Review API provider contracts (HIGH)
2. Plan Q1 marketing campaign (MEDIUM)
3. Evaluate new vendor opportunities (LOW)`,
        metrics: mockMetrics
      });
    }

    const genai = new GoogleGenerativeAI(geminiKey);
    const prompt = `You are a financial analysis expert. Analyze this business data and provide insights:

**Financial Summary (Last ${daysNum} days):**
- Total Revenue: $${mockMetrics.totalRevenue}
- Total Expenses: $${mockMetrics.totalExpenses}
- Net Profit: $${mockMetrics.netProfit}
- Transactions Count: ${mockMetrics.transactionCount}
- Payment Completion Rate: ${mockMetrics.completionRate}%

Provide:
1. **Financial Health Score** (0-100)
2. **Key Insights** (3-5 findings)
3. **Revenue Trends** (growth patterns)
4. **Cost Optimization** (areas to reduce spending)
5. **Growth Opportunities** (3-5 recommendations)
6. **Risk Alerts** (concerning patterns)
7. **Action Items** (prioritized next steps)

Keep it concise and actionable.`;

    const model = genai.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    res.json({
      success: true,
      analysis,
      metrics: mockMetrics
    });
  } catch (error) {
    console.error("Error analyzing data:", error);
    res.json({
      success: true,
      analysis: `**Error Running Analysis**
Unable to generate AI analysis at this moment.

**Current Metrics**
- Total Revenue: $15,250.00
- Total Expenses: $3,450.00
- Net Profit: $11,800.00

Please try again later for detailed insights.`,
      metrics: {
        totalRevenue: "15,250.00",
        totalExpenses: "3,450.00",
        netProfit: "11,800.00",
        completionRate: "94.5",
        transactionCount: 47
      }
    });
  }
});

export default router;
