<a href="https://18ks.chivoxapp.com/doc/video20260424.mp4" title="▶ Play 15s product demo">
  <img
    src="https://raw.githubusercontent.com/boyzhong123/mcp22/main/assets/hero-v9-2x.png?v=9"
    srcset="https://raw.githubusercontent.com/boyzhong123/mcp22/main/assets/hero-v9-2x.png?v=9 2x"
    alt="Chivox MCP — Give your LLM ears. Ship a Mandarin tutor or IELTS coach in a weekend. Click to play the 15s demo."
    width="100%"
  />
</a>

<div align="center">

<a href="#-quickstart"><img src="https://img.shields.io/badge/▶_Install_in_30_seconds-1a7f37?style=for-the-badge" alt="Install in 30 seconds"/></a>

<br/>

<img src="https://img.shields.io/badge/release-v1.1.5-111827?style=flat-square" alt="release"/>
<img src="https://img.shields.io/npm/v/@chivox/mcp?style=flat-square&logo=npm&logoColor=white&color=cb3837" alt="npm"/>
<img src="https://img.shields.io/badge/license-Apache%202.0-blue?style=flat-square" alt="license"/>
<img src="https://img.shields.io/badge/MCP-ready-10B981?style=flat-square" alt="mcp"/>
<img src="https://img.shields.io/badge/tools-16-7C3AED?style=flat-square" alt="tools"/>
<img src="https://img.shields.io/badge/ISO%2027001-certified-2563EB?style=flat-square" alt="iso"/>
<img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="prs"/>

<br/>

<img src="./assets/stats-v6-2x.png" alt="9.2B+ evals/year · 185 countries · 95%+ human agreement · <200ms P99 first token" width="100%"/>

</div>

---

> **TL;DR** — **LLMs can't hear audio. Chivox MCP gives them ears: one tool call returns `overall / accuracy / fluency / phonemes[]` — a structured JSON your model can reason over directly. No SDK wrapping, no feature extraction, no glue code.**

> 🛠️ **For ops / engineers running this repo:** see [`docs/deploy/README.md`](./docs/deploy/README.md) for the deployment guide, or paste [`docs/deploy/quickstart-prompt.md`](./docs/deploy/quickstart-prompt.md) into Cursor / Claude / Codex to spin up a local preview in ~30 seconds.

---

## 🎯 Is this for you?

<img
  src="./assets/fit-v4-2x.png"
  alt="Is this for you? fit check"
  width="100%"
/>

> Most production teams run **Whisper + Chivox together**: Whisper to transcribe what was said, Chivox to score how well. They don't compete.

---

## 🚀 Quickstart

Pick your stack. All paths speak the same MCP protocol.

<details open>
<summary><b>🐍 Python</b> &nbsp;<sub>(recommended)</sub></summary>

```python
import asyncio
from mcp.client.streamable_http import streamablehttp_client
from mcp import ClientSession

async def main():
    async with streamablehttp_client(
        "https://speech-eval.site/mcp",
        headers={"Authorization": "Bearer $CHIVOX_API_KEY"},
    ) as (r, w, _):
        async with ClientSession(r, w) as s:
            await s.initialize()
            out = await s.call_tool("en_sentence_eval", {
                "reference_text": "The weather is gorgeous today.",
                "audio_url":      "https://demo.com/take-01.mp3",
            })
            print(out)

asyncio.run(main())
```

</details>

<details>
<summary><b>cURL</b> &nbsp;<sub>(instant try · no signup)</sub></summary>

```bash
# Hello world — get a score in one call, no API key
curl https://speech-eval.site/mcp/try \
  -H "Content-Type: application/json" \
  -d '{"ref_text":"你好","audio_url":"https://demo.chivox.com/nihao.mp3"}'
```

Example response:

```json
{ "overall": 82, "tones": [3, 3], "verdict": "native-like" }
```

</details>

<details>
<summary><b>LangChain</b> &nbsp;<sub>(Python, 0.3+)</sub></summary>

```python
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI

client = MultiServerMCPClient({
    "chivox": {
        "transport": "streamable_http",
        "url": "https://speech-eval.site/mcp",
        "headers": {"Authorization": "Bearer $CHIVOX_API_KEY"},
    }
})
tools = await client.get_tools()   # auto-discovers all 16 tools

agent = create_react_agent(ChatOpenAI(model="gpt-4o"), tools)

await agent.ainvoke({"messages": [
    ("user", "Score my Mandarin: https://demo.com/nihao.mp3. Ref: 你好")
]})
```

</details>

<details>
<summary><b>OpenAI Agents SDK</b></summary>

```python
from agents import Agent, Runner
from agents.mcp import MCPServerStreamableHttp

async with MCPServerStreamableHttp(
    params={"url": "https://speech-eval.site/mcp",
            "headers": {"Authorization": "Bearer $KEY"}},
) as chivox:
    coach = Agent(
        name="Mandarin Coach",
        model="gpt-4o",
        instructions="You are a warm, patient Beijing-accent tutor. "
                     "Score learner audio via Chivox, then give feedback "
                     "+ a targeted drill.",
        mcp_servers=[chivox],
    )
    result = await Runner.run(coach, input="Grade this: ...")
    print(result.final_output)
```

</details>

<details>
<summary><b>Node.js / TypeScript</b></summary>

```ts
import { Client } from '@modelcontextprotocol/sdk/client';

const chivox = await Client.connect({ name: 'chivox' });

const result = await chivox.callTool('en_sentence_eval', {
  reference_text: 'The weather is gorgeous today.',
  audio_url:      'https://demo.com/take-01.mp3',
});

console.log(result.overall);   // 72
console.log(result.details);   // per-word + phonemes
```

</details>

<details>
<summary><b>Cursor</b></summary>

```json
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "chivox": {
      "type": "streamable-http",
      "url":  "https://speech-eval.site/mcp",
      "env":  { "CHIVOX_API_KEY": "sk_live_…" }
    }
  }
