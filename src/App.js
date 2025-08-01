import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Send, Bot, User, CheckCircle, AlertCircle, Clock, CreditCard, Car, MapPin, FileText, Phone } from 'lucide-react';

const ChatApp = () => {
  const [activeScenario, setActiveScenario] = useState(1);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [satisfactionStatus, setSatisfactionStatus] = useState({});
  const messagesEndRef = useRef(null);

  // Dummy conversations for each scenario
  const scenarios = useMemo(() => ({
    1: {
      title: "Non-member FAQ",
      icon: FileText,
      responses: [
        {
          text: "Hello! This is the Malaysian MLFF toll service. Would you like to log in to resolve your inquiry?",
          options: ["Login", "Continue as a guest"],
          type: 'welcome'
        },
        {
          text: "Yes, we will proceed with the consultation as a non-member. How can I help you?",
          type: 'text'
        },
        {
          text: "In the MLFF system, for vehicles without an RFID tag, the toll is charged postpaid by automatically recognizing the license plate.",
          additionalInfo: {
            title: "Information for vehicles without RFID",
            details: [
              { icon: Car, text: "Automatic license plate recognition" },
              { icon: Clock, text: "Payment within 7 days of passage" },
              { icon: CreditCard, text: "Online/offline payment available" }
            ],
            link: { text: "Go to payment guide page", url: "#" }
          },
          type: 'detailed'
        },
        {
          text: "I'm glad I could help! If you have no other questions, I will end the consultation.",
          satisfaction: true,
          type: 'closing'
        }
      ]
    },
    2: {
      title: "Member Inquiry",
      icon: CreditCard,
      responses: [
        {
          text: "Hello! This is the Malaysian MLFF toll service. Would you like to log in to resolve your inquiry?",
          options: ["Login", "Continue as a guest"],
          type: 'welcome'
        },
        {
          text: "Member authentication is complete. Hello, Minsu Kim! How can I help you?",
          options: ["Check unpaid balance", "View usage history", "RFID registration status"],
          type: 'authenticated'
        },
        // --- Unpaid balance scenario ---
        {
          text: "Checking unpaid balance...",
          type: 'loading',
          trigger: "Check unpaid balance"
        },
        {
          text: "Minsu Kim, you have a total of 2 unpaid items, amounting to RM 12.50.",
          additionalInfo: {
            title: "Details of unpaid tolls",
            details: [
              { icon: MapPin, text: "7/15 - Duke Highway (RM 5.50)" },
              { icon: MapPin, text: "7/20 - SMART Tunnel (RM 7.00)" },
              { icon: Clock, text: "Payment due: by 7/27" }
            ],
            link: { text: "Pay now", url: "#" }
          },
          type: 'detailed'
        },
        // --- Usage history scenario ---
        {
          text: "Retrieving usage history...",
          type: 'loading',
          trigger: "View usage history"
        },
        {
          text: "Minsu Kim, your usage history for the last month is 5 transactions, totaling RM 25.00.",
          additionalInfo: {
            title: "Recent toll usage history",
            details: [
              { icon: MapPin, text: "7/22 - KESAS Highway (RM 2.00)" },
              { icon: MapPin, text: "7/18 - LDP Highway (RM 3.00)" },
              { icon: MapPin, text: "7/15 - Duke Highway (RM 5.50)" },
              { icon: MapPin, text: "7/10 - SMART Tunnel (RM 7.00)" },
              { icon: MapPin, text: "7/02 - NPE Highway (RM 7.50)" },
            ],
            link: { text: "Download full history", url: "#" }
          },
          type: 'detailed'
        },
        // --- RFID status scenario ---
        {
          text: "Checking RFID registration status...",
          type: 'loading',
          trigger: "RFID registration status"
        },
        {
          text: "Minsu Kim's vehicle (ABC 1234) has its RFID tag normally registered and activated.",
          additionalInfo: {
            title: "RFID Tag Information",
            details: [
              { icon: Car, text: "Vehicle number: ABC 1234" },
              { icon: CheckCircle, text: "Status: Active" },
              { icon: CreditCard, text: "Linked card: ****-****-****-5678" }
            ],
            link: { text: "Edit tag information", url: "#" }
          },
          type: 'detailed'
        },
        // --- Common closing ---
        {
          text: "Have you confirmed? Do you have any other questions?",
          satisfaction: true,
          type: 'closing'
        }
      ]
    },
    3: {
      title: "Agent Transfer",
      icon: Phone,
      responses: [
        {
          text: "Hello! This is the Malaysian MLFF toll service. How can I help you?",
          type: 'welcome'
        },
        {
          text: "I will check on the license plate misidentification issue. Please wait a moment...",
          type: 'loading'
        },
        {
          text: "Sir, this issue requires confirmation from a professional agent. Shall I connect you to an agent?",
          options: ["Yes, please connect", "I'll do it later"],
          type: 'escalation'
        },
        {
          text: "Connecting to an agent. Please wait a moment...",
          additionalInfo: {
            title: "Agent Connection Guide",
            details: [
              { icon: Clock, text: "Estimated waiting time: 2-3 minutes" },
              { icon: User, text: "People currently waiting: 3" },
              { icon: Phone, text: "Operating hours: 09:00 - 18:00" }
            ]
          },
          type: 'connecting'
        },
        {
          text: "Agent connected.",
          type: 'agentConnected'
        },
        {
          text: "Hello, this is agent Jihyun Lee. I have reviewed your conversation with the AI. You inquired about a license plate misidentification issue. I will check the toll record for July 5th.",
          agent: true,
          type: 'agent'
        },
        {
          text: "Sir, a record of passing through Duke Highway at 14:30 on July 5th has been confirmed. After checking the vehicle image, it seems that the license plate was partially obscured, leading to a misidentification. I will correct it immediately.",
          agent: true,
          additionalInfo: {
            title: "Resolution Result",
            image: "/images/license-plate.png",
            details: [
              { icon: CheckCircle, text: "Incorrectly charged fee canceled" },
              { icon: CreditCard, text: "Refund scheduled in 3-5 business days" },
              { icon: FileText, text: "Case number: CS2024-0705-1234" }
            ]
          },
          type: 'resolution'
        }
      ]
    }
  }), []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addBotMessage = useCallback((response) => {
    setIsTyping(true);
    const typingTime = response.type === 'loading' ? 2000 : 1500;

    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: response.text,
        sender: response.agent ? 'agent' : 'bot',
        timestamp: new Date(),
        options: response.options,
        additionalInfo: response.additionalInfo,
        satisfaction: response.satisfaction,
        type: response.type
      }]);
      setIsTyping(false);

      // Automatically proceed to the next message for loading, connecting, agentConnected types
      if (response.type === 'loading' || response.type === 'connecting' || response.type === 'agentConnected') {
        const currentResponses = scenarios[activeScenario].responses;
        const currentIndex = currentResponses.findIndex(r => r.text === response.text && r.type === response.type);

        if (currentIndex !== -1) {
          const nextStep = currentIndex + 1;
          if (nextStep < currentResponses.length) {
            setCurrentStep(nextStep);
            
            let delay = 500;
            if (response.type === 'connecting') {
              delay = 3000;
            } else if (response.type === 'agentConnected') {
              delay = 1000; // Show agent message after 1 second
            }

            setTimeout(() => {
              addBotMessage(currentResponses[nextStep]);
            }, delay);
          }
        }
      }
    }, typingTime);
  }, [activeScenario, scenarios]);

  useEffect(() => {
    // Initialize when scenario changes
    setMessages([]);
    setCurrentStep(0);
    setSatisfactionStatus({});
    setIsTyping(false);

    // Show the first message of the new scenario
    setTimeout(() => {
      addBotMessage(scenarios[activeScenario].responses[0]);
    }, 500);
  }, [activeScenario, addBotMessage, scenarios]);

  const handleSend = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    setMessages(prev => [...prev, {
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }]);

    setInputValue('');

    // Next bot response
    const nextStep = currentStep + 1;
    if (nextStep < scenarios[activeScenario].responses.length) {
      setCurrentStep(nextStep);
      addBotMessage(scenarios[activeScenario].responses[nextStep]);
    }
  };

  const handleOptionClick = (option) => {
    // Treat option click as a user message
    setMessages(prev => [...prev, {
      text: option,
      sender: 'user',
      timestamp: new Date()
    }]);

    const currentResponses = scenarios[activeScenario].responses;
    // Find the response where the 'trigger' property matches the option text.
    const nextStepIndex = currentResponses.findIndex(r => r.trigger === option);

    if (nextStepIndex !== -1) {
      setCurrentStep(nextStepIndex);
      addBotMessage(currentResponses[nextStepIndex]);
    } else {
      // Special handling for "Yes, please connect" option
      if (option === "Yes, please connect") {
        const escalationResponse = currentResponses.find(r => r.type === 'escalation');
        const escalationIndex = currentResponses.indexOf(escalationResponse);
        const connectingStep = escalationIndex + 1;
        
        if (connectingStep < currentResponses.length) {
          setCurrentStep(connectingStep);
          addBotMessage(currentResponses[connectingStep]);
        }
      } else {
        // Maintain existing logic if no matching trigger is found (e.g., Login, Continue as guest)
        const nextStep = currentStep + 1;
        if (nextStep < currentResponses.length) {
          setCurrentStep(nextStep);
          addBotMessage(currentResponses[nextStep]);
        }
      }
    }
  };

  const handleSatisfaction = (messageIndex, type) => {
    setSatisfactionStatus(prev => ({
      ...prev,
      [messageIndex]: type
    }));
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MessageBubble = ({ message, index }) => {
    const isBot = message.sender === 'bot';
    const isAgent = message.sender === 'agent';
    const isUser = message.sender === 'user';
    const selectedSatisfaction = satisfactionStatus[index];
    const [animate, setAnimate] = useState(true);

    useEffect(() => {
      if (message.type === 'agentConnected') {
        const timer = setTimeout(() => setAnimate(false), 1000); // Change state after animation duration
        return () => clearTimeout(timer);
      }
    }, [message.type]);

    return (
      <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start max-w-[85%]`}>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isAgent ? 'bg-purple-500 mr-2' : isBot ? 'bg-blue-500 mr-2' : 'bg-gray-500 ml-2'
          }`}>
            {isAgent ? <User className="w-5 h-5 text-white" /> : isBot ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
          </div>

          <div>
            {isAgent && (
              <p className="text-xs text-purple-600 font-medium mb-1">Agent Jihyun Lee</p>
            )}
            <div className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-blue-500 text-white rounded-tr-none'
                : isAgent
                ? 'bg-purple-100 text-gray-800 rounded-tl-none'
                : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              {message.type === 'agentConnected' ? (
                <div className={`flex items-center justify-center p-2 bg-white rounded-lg shadow-sm border border-gray-200 ${animate ? 'animate-agent-connected' : ''}`}>
                  <CheckCircle className={`w-5 h-5 text-purple-500 mr-2 ${animate ? 'animate-scale-in-fast' : ''}`} />
                  <p className="text-sm font-medium text-purple-600">{message.text}</p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{message.text}</p>
              )}

              {/* Detailed Info Card */}
              {message.additionalInfo && (
                <div className="mt-3 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">{message.additionalInfo.title}</h4>
                  {message.additionalInfo.image && (
                    <img src={process.env.PUBLIC_URL + message.additionalInfo.image} alt="License plate" className="w-full rounded-lg mt-2 mb-3 border" />
                  )}
                  <div className="space-y-2">
                    {message.additionalInfo.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center text-gray-700">
                        <detail.icon className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="text-sm">{detail.text}</span>
                      </div>
                    ))}
                  </div>
                  {message.additionalInfo.link && (
                    <a
                      href={message.additionalInfo.link.url}
                      className="inline-flex items-center mt-3 text-blue-500 text-sm font-medium hover:underline"
                    >
                      {message.additionalInfo.link.text} →
                    </a>
                  )}
                </div>
              )}

              {/* Satisfaction Survey */}
              {message.satisfaction && (
                <div className="mt-3">
                  {!selectedSatisfaction ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSatisfaction(index, 'satisfied')}
                        className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Satisfied
                      </button>
                      <button
                        onClick={() => handleSatisfaction(index, 'unsatisfied')}
                        className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Unsatisfied
                      </button>
                    </div>
                  ) : (
                    <div className={`
                      flex items-center justify-center py-3 px-4 rounded-lg
                      ${selectedSatisfaction === 'satisfied' ? 'bg-green-100' : 'bg-red-100'}
                      animate-bounce-in
                    `}>
                      {selectedSatisfaction === 'satisfied' ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600 mr-2 animate-scale-in" />
                          <span className="text-green-700 font-medium">Thank you! 😊</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-600 mr-2 animate-scale-in" />
                          <span className="text-red-700 font-medium">We will improve 🙏</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Option Buttons */}
            {message.options && (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(option)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header with Tabs */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">MLFF Customer Support</h1>
                <p className="text-xs text-blue-100">AI assistant is here to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs">Online</span>
            </div>
          </div>

          {/* Scenario Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-1">
            {Object.entries(scenarios).map(([key, scenario]) => {
              const Icon = scenario.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveScenario(parseInt(key))}
                  className={`
                    flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                    ${activeScenario === parseInt(key)
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {scenario.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <style jsx>{`
          @keyframes bounce-in {
            0% {
              transform: scale(0.8);
              opacity: 0;
            }
            50% {
              transform: scale(1.05);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes scale-in {
            0% {
              transform: scale(0);
            }
            50% {
              transform: scale(1.2);
            }
            100% {
              transform: scale(1);
            }
          }

          .animate-bounce-in {
            animation: bounce-in 0.4s ease-out;
          }

          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
          
          @keyframes agent-connected-animation {
            0% { transform: translateY(20px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }

          .animate-agent-connected {
            animation: agent-connected-animation 0.5s ease-out forwards;
          }

          @keyframes scale-in-fast {
           0% { transform: scale(0); }
           50% { transform: scale(1.3); }
           100% { transform: scale(1); }
          }

          .animate-scale-in-fast {
           animation: scale-in-fast 0.4s 0.2s ease-out backwards;
          }
        `}</style>

        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} index={index} />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Enter a message..."
            className="flex-1 px-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          <button
            onClick={handleSend}
            className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-3 flex space-x-2 overflow-x-auto pb-1">
          <button className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 whitespace-nowrap hover:bg-gray-200 transition-colors">
            <MapPin className="w-3 h-3 mr-1" />
            Toll History
          </button>
          <button className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 whitespace-nowrap hover:bg-gray-200 transition-colors">
            <CreditCard className="w-3 h-3 mr-1" />
            Unpaid Tolls
          </button>
          <button className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 whitespace-nowrap hover:bg-gray-200 transition-colors">
            <Car className="w-3 h-3 mr-1" />
            RFID Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;