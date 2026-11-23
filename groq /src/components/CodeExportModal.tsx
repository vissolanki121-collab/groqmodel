import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code2 } from 'lucide-react';
import { ModelParameters, PromptExample } from '../types';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: string;
  systemPrompt: string;
  examples: PromptExample[];
  userPrompt: string;
  parameters: ModelParameters;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  model,
  systemPrompt,
  examples,
  userPrompt,
  parameters,
}) => {
  const [activeTab, setActiveTab] = useState<'python' | 'javascript' | 'curl'>('python');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build the message array representation
  const messagesList: Array<{ role: string; content: string }> = [];
  if (systemPrompt.trim()) {
    messagesList.push({ role: 'system', content: systemPrompt.trim() });
  }
  examples.forEach((ex) => {
    if (ex.userInput.trim() && ex.assistantResponse.trim()) {
      messagesList.push({ role: 'user', content: ex.userInput.trim() });
      messagesList.push({ role: 'assistant', content: ex.assistantResponse.trim() });
    }
  });
  if (userPrompt.trim()) {
    messagesList.push({ role: 'user', content: userPrompt.trim() });
  } else {
    messagesList.push({ role: 'user', content: 'Your question here...' });
  }

  // Generate Python Code
  const pythonCode = `import os
from groq import Groq

# Initialize client with your GROQ_API_KEY environment variable
client = Groq(
    api_key=os.environ.get("GROQ_API_KEY"),
)

completion = client.chat.completions.create(
    model="${model}",
    messages=${JSON.stringify(messagesList, null, 8).replace(/"role"/g, '"role"').replace(/"content"/g, '"content"')},
    temperature=${parameters.temperature},
    max_tokens=${parameters.maxTokens},
    top_p=${parameters.topP},
    frequency_penalty=${parameters.frequencyPenalty},
    presence_penalty=${parameters.presencePenalty},
    stream=${parameters.stream ? 'True' : 'False'},
)

${parameters.stream ? `for chunk in completion:
    print(chunk.choices[0].delta.content or "", end="")` : `print(completion.choices[0].message.content)`}`;

  // Generate JavaScript Code
  const jsCode = `import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function main() {
  const completion = await groq.chat.completions.create({
    model: "${model}",
    messages: ${JSON.stringify(messagesList, null, 6)},
    temperature: ${parameters.temperature},
    max_tokens: ${parameters.maxTokens},
    top_p: ${parameters.topP},
    frequency_penalty: ${parameters.frequencyPenalty},
    presence_penalty: ${parameters.presencePenalty},
    stream: ${parameters.stream},
  });

  ${parameters.stream ? `for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }` : `console.log(completion.choices[0]?.message?.content);`}
}

main().catch(console.error);`;

  // Generate cURL Command
  const curlCode = `curl https://api.groq.com/openai/v1/chat/completions \\
  -H "Authorization: Bearer $GROQ_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(
    {
      model,
      messages: messagesList,
      temperature: parameters.temperature,
      max_tokens: parameters.maxTokens,
      top_p: parameters.topP,
      frequency_penalty: parameters.frequencyPenalty,
      presence_penalty: parameters.presencePenalty,
      stream: parameters.stream,
    },
    null,
    2
  )}'`;

  const currentCode = activeTab === 'python' ? pythonCode : activeTab === 'javascript' ? jsCode : curlCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0e1017] border border-[#232738] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#141724] border-b border-[#232738]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Code2 className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Export Playground Code</h2>
              <p className="text-xs text-gray-400">Ready-to-run code including system prompt, few-shot examples & parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Controls & Copy */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-[#12141e] border-b border-[#232738]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'python'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              Python (SDK)
            </button>
            <button
              onClick={() => setActiveTab('javascript')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'javascript'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              JavaScript / TypeScript
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'curl'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              cURL
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code View Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#0a0b10]">
          <pre className="p-4 rounded-lg bg-[#0f111a] border border-[#1e2230] font-mono text-xs text-orange-300/90 overflow-x-auto leading-relaxed">
            <code>{currentCode}</code>
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#141724] border-t border-[#232738] text-[11px] text-gray-400">
          <span>Target Model: <strong className="text-gray-200">{model}</strong></span>
          <span>Requires <code className="text-orange-400">GROQ_API_KEY</code> set in environment</span>
        </div>
      </div>
    </div>
  );
};
