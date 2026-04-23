/**
 * Mock AI service for the Personal Finance Assistant.
 *
 * Architecture note:
 * The single exported function `getAIResponse(userMessage)` is the only
 * integration point. To connect a real LLM (OpenAI, Anthropic, etc.) later,
 * replace the body of this function — no other files need to change.
 */

import type { ChatMessage, SuggestedPrompt } from '../types/chat'

// ─── Response delay ───────────────────────────────────────────────────────────
// Simulates network latency so the loading state is visible to the user.
const MIN_DELAY_MS = 800
const MAX_DELAY_MS = 1800

function randomDelay(): Promise<void> {
  const ms = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Keyword → response map ───────────────────────────────────────────────────
// Each entry has a set of trigger keywords and one or more possible responses.
// A random response is picked when multiple are available to feel less robotic.

interface ResponseRule {
  keywords: string[]
  responses: string[]
}

const RESPONSE_RULES: ResponseRule[] = [
  {
    keywords: ['budget', 'budgeting', 'budgets', 'monthly budget'],
    responses: [
      `Great question! Here are some budgeting fundamentals to get you started:

**The 50/30/20 rule** is a solid baseline:
- **50%** of take-home pay → needs (rent, groceries, utilities)
- **30%** → wants (dining out, subscriptions, entertainment)
- **20%** → savings and debt repayment

Your biggest opportunity is usually in the "wants" bucket. Try reviewing your subscriptions — most people have 2–3 they've forgotten about.

Would you like me to break down your spending by category?`,

      `Budgeting works best when it's realistic, not restrictive. Here's a practical approach:

1. **Track first** — spend one month recording everything without changing behaviour. You need accurate data before making cuts.
2. **Identify fixed vs variable** — fixed costs (rent, insurance) are hard to change; variable costs (food, entertainment) are where you have leverage.
3. **Set category limits** — once you know your baseline, reduce variable categories by 10–15% at a time.
4. **Review weekly** — a 5-minute weekly check-in prevents surprises at month end.

Your dashboard already shows your category breakdown — that's a great starting point!`,
    ],
  },
  {
    keywords: ['overspend', 'overspending', 'spending too much', 'where am i spending', 'where is my money', 'this month'],
    responses: [
      `Based on typical spending patterns, here are the most common overspending traps:

🍔 **Food & Dining** — Eating out 3–4× per week adds up fast. Even cutting one restaurant meal per week can save €150–200/month.

📱 **Subscriptions** — The average person pays for 4–6 streaming/software services they rarely use. Audit yours quarterly.

🛒 **Impulse shopping** — Online shopping makes it too easy. Try a 24-hour rule: add to cart, wait a day, then decide.

☕ **Daily habits** — A daily coffee shop visit costs ~€1,000/year. Making coffee at home 3 days a week saves ~€400.

Check your **Transactions** page filtered by category to see your personal breakdown!`,
    ],
  },
  {
    keywords: ['save', 'saving', 'savings', 'how much should i save'],
    responses: [
      `A good savings target depends on your situation, but here are evidence-based benchmarks:

**Emergency fund first** — Before anything else, build 3–6 months of living expenses in a liquid account. This is your financial safety net.

**Retirement** — Aim to save 15% of gross income for retirement (including any employer match). The earlier you start, the more compound growth works in your favour.

**Short-term goals** — For goals within 1–3 years (holiday, car, home deposit), keep savings in a high-yield savings account.

**Rule of thumb**: If you're just starting out, even saving 5–10% consistently beats saving 20% inconsistently. Automate it — set up a standing order on payday so you never see the money.

What are you saving towards? I can give more specific advice!`,

      `The classic answer is "save as much as you can," but that's not helpful. Here's a more practical framework:

**Minimum viable savings rate**: 10% of take-home pay
**Comfortable savings rate**: 15–20%
**Aggressive savings rate**: 25%+

To find your current rate: divide your monthly savings by your monthly take-home pay.

If you're below 10%, focus on reducing your two largest expense categories first — that's usually where the biggest wins are. Your **Budget** page can show you where you're over your limits.`,
    ],
  },
  {
    keywords: ['goal', 'goals', 'savings goal', 'target', 'reach my goal', 'faster'],
    responses: [
      `To reach savings goals faster, here are the highest-impact strategies:

**1. Automate contributions** — Set up an automatic transfer on payday. "Pay yourself first" removes willpower from the equation.

**2. Use the windfall rule** — Commit 50% of any unexpected money (bonus, tax refund, gift) directly to your goal.

**3. Find one recurring expense to cut** — Even €50/month adds up to €600/year. That could be a gym membership you rarely use or a streaming service.

**4. Track progress visually** — Seeing your progress bar move is genuinely motivating. Your **Goals** page shows exactly this!

**5. Break it into milestones** — A €10,000 goal feels overwhelming; ten €1,000 milestones feel achievable.

Which goal are you working towards? I can help you calculate a realistic timeline.`,
    ],
  },
  {
    keywords: ['invest', 'investing', 'investment', 'stocks', 'etf', 'index fund'],
    responses: [
      `Investing is one of the most powerful tools for long-term wealth. Here's a beginner-friendly framework:

**Before you invest, make sure:**
- ✅ Emergency fund is in place (3–6 months expenses)
- ✅ High-interest debt is paid off (anything above 6–7% APR)
- ✅ You have a stable monthly budget

**Where to start:**
- **Index funds / ETFs** — Low-cost, diversified, and historically outperform most actively managed funds over 10+ years. Look for funds tracking the S&P 500 or a global index.
- **Pension / retirement account** — If your employer offers matching contributions, that's an instant 50–100% return. Always max this first.
- **Regular investing** — Investing a fixed amount monthly (called "dollar-cost averaging") removes the stress of timing the market.

**Key principle**: Time in the market beats timing the market. Starting with €100/month today is better than waiting to invest €500/month "when the time is right."`,
    ],
  },
  {
    keywords: ['debt', 'loan', 'credit card', 'pay off', 'interest'],
    responses: [
      `Paying off debt strategically can save you thousands in interest. Two proven methods:

**Avalanche method** (mathematically optimal):
Pay minimums on all debts, then throw every extra euro at the highest-interest debt first. Once it's gone, roll that payment to the next highest. This minimises total interest paid.

**Snowball method** (psychologically powerful):
Pay minimums on all debts, then attack the smallest balance first. The quick wins build momentum and motivation.

**Which to choose?** If you're disciplined, use Avalanche. If you need motivation to stay on track, use Snowball. The best method is the one you'll actually stick to.

**General rule**: Any debt above 6–7% interest should be paid off before investing (except pension contributions with employer matching).

What type of debt are you dealing with? I can give more specific guidance.`,
    ],
  },
  {
    keywords: ['income', 'earn more', 'side hustle', 'raise', 'salary'],
    responses: [
      `Increasing income is often more impactful than cutting expenses — there's no ceiling on earning, but there is a floor on spending. Here are practical approaches:

**In your current job:**
- Research market rates for your role (Glassdoor, LinkedIn Salary). If you're underpaid, you have data to negotiate.
- Ask for a raise at your annual review — most employers expect it. Come prepared with your achievements and market data.

**Side income:**
- Freelancing in your professional skill set typically pays the highest hourly rate.
- Selling unused items is a quick one-time boost.
- Teaching or tutoring (online platforms make this accessible).

**Passive income (longer term):**
- Dividend-paying investments
- Rental income
- Digital products

Even a €200–300/month side income, invested consistently, compounds significantly over 10–20 years.`,
    ],
  },
  {
    keywords: ['emergency fund', 'emergency', 'rainy day'],
    responses: [
      `An emergency fund is the foundation of financial security. Here's everything you need to know:

**How much?** 3 months if you have a stable job and low fixed costs. 6 months if you're self-employed, have dependants, or work in a volatile industry.

**Where to keep it?** A high-yield savings account — accessible within 1–2 business days, but not so easy to dip into that you spend it on non-emergencies.

**What counts as an emergency?** Job loss, medical expenses, urgent home/car repairs. A sale at your favourite store does not count! 😄

**How to build it?** Set a monthly auto-transfer, even if it's just €50. Treat it like a bill you pay yourself. Once it's funded, redirect that amount to investments or other goals.

Your emergency fund is the one savings goal that should never be paused for other goals.`,
    ],
  },
  {
    keywords: ['tip', 'tips', 'advice', 'help', 'improve', 'better'],
    responses: [
      `Here are my top 5 personal finance tips that have the biggest impact:

**1. Automate everything** — Savings, bill payments, investments. Remove decisions and willpower from the equation.

**2. Track your net worth monthly** — Not just income and expenses. Knowing your total assets minus liabilities gives you the real picture.

**3. Increase savings rate with every raise** — When you get a pay rise, increase your savings rate by half the raise amount. You'll still feel richer, but you'll also save more.

**4. Review subscriptions quarterly** — Cancel anything you haven't used in 30 days.

**5. Learn one new financial concept per month** — Compound interest, tax-advantaged accounts, asset allocation. Knowledge compounds too.

Is there a specific area you'd like to dive deeper into?`,
    ],
  },
  {
    keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'start', 'begin'],
    responses: [
      `Hello! 👋 I'm your AI Finance Assistant. I'm here to help you make smarter decisions with your money.

Here are some things I can help you with:
- 📊 **Budgeting** — building and sticking to a budget
- 💰 **Saving** — strategies to save more effectively
- 🎯 **Goals** — reaching your financial targets faster
- 📈 **Investing** — getting started with investing
- 💳 **Debt** — paying off debt strategically

What's on your mind today?`,
    ],
  },
  {
    keywords: ['thank', 'thanks', 'thank you', 'helpful', 'great'],
    responses: [
      `You're welcome! 😊 Feel free to ask anything else — whether it's about budgeting, saving, investing, or any other financial topic. I'm here to help!`,
      `Happy to help! Financial clarity is a journey, not a destination. Keep asking questions — that's how you build good money habits. Is there anything else you'd like to explore?`,
    ],
  },
]

// ─── Fallback responses ───────────────────────────────────────────────────────
// Used when no keyword rule matches the user's message.

const FALLBACK_RESPONSES: string[] = [
  `That's a great question! While I don't have specific data on that topic yet, here's some general financial guidance:

The most important financial habits are:
1. **Spend less than you earn** — the foundation of everything
2. **Build an emergency fund** — 3–6 months of expenses
3. **Invest consistently** — even small amounts, started early, grow significantly
4. **Review your finances monthly** — awareness is the first step to improvement

Could you rephrase your question or give me more context? I want to make sure I give you the most relevant advice.`,

  `I want to make sure I give you the most helpful answer. Could you tell me a bit more about what you're trying to achieve? For example:

- Are you trying to **save more** each month?
- Looking to **pay off debt** faster?
- Wanting to **start investing**?
- Trying to **stick to a budget**?

The more specific you are, the better I can tailor my advice to your situation!`,

  `Personal finance is highly individual, so the best answer depends on your specific situation.

In general, I'd recommend starting with your **Goals** page to set clear targets, then using the **Budget** page to align your spending with those goals. Your **Analytics** page can show you trends over time.

What specific aspect of your finances would you like to improve?`,
]

// ─── Utility: pick a random item from an array ────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Core matching logic ──────────────────────────────────────────────────────

function findMatchingResponse(userMessage: string): string {
  const normalised = userMessage.toLowerCase()

  for (const rule of RESPONSE_RULES) {
    const matched = rule.keywords.some((kw) => normalised.includes(kw))
    if (matched) {
      return pickRandom(rule.responses)
    }
  }

  return pickRandom(FALLBACK_RESPONSES)
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Simulates an AI response to a user finance question.
 *
 * @param userMessage - The raw text the user typed
 * @param _history    - Full conversation history (unused in mock; available for
 *                      real API integration where context matters)
 * @returns           - The assistant's response string
 *
 * INTEGRATION NOTE:
 * Replace this function body with a real API call (e.g. OpenAI Chat Completions)
 * when you're ready to go live. The signature and return type stay the same.
 */
export async function getAIResponse(
  userMessage: string,
  _history: ChatMessage[] = [],
): Promise<string> {
  // Simulate network latency
  await randomDelay()
  return findMatchingResponse(userMessage)
}

// ─── Suggested prompts ────────────────────────────────────────────────────────
// Shown to the user before they type their first message.
// Exported so the SuggestedPrompts component can render them without coupling
// to the AI matching logic.

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: 'sp-1',
    label: 'Improve my budget',
    prompt: 'How can I improve my monthly budget?',
  },
  {
    id: 'sp-2',
    label: 'Where am I overspending?',
    prompt: 'Where am I overspending this month?',
  },
  {
    id: 'sp-3',
    label: 'How much to save?',
    prompt: 'How much should I save each month?',
  },
  {
    id: 'sp-4',
    label: 'Reach goals faster',
    prompt: 'Any tips to reach my savings goals faster?',
  },
  {
    id: 'sp-5',
    label: 'Start investing',
    prompt: 'How do I start investing with a small amount?',
  },
  {
    id: 'sp-6',
    label: 'Pay off debt',
    prompt: 'What is the best strategy to pay off my credit card debt?',
  },
]