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

  // 시나리오별 더미 대화
  const scenarios = useMemo(() => ({
    1: {
      title: "비회원 FAQ",
      icon: FileText,
      responses: [
        {
          text: "안녕하세요! 말레이시아 MLFF 통행료 서비스입니다. 문의 해결을 위해 회원 로그인을 하시겠어요?",
          options: ["로그인", "비회원으로 계속"],
          type: 'welcome'
        },
        {
          text: "네, 비회원으로 상담을 진행합니다. 무엇을 도와드릴까요?",
          type: 'text'
        },
        {
          text: "MLFF 시스템에서는 RFID 태그가 없는 차량의 경우, 차량 번호판을 자동으로 인식하여 통행료가 후불로 부과됩니다.",
          additionalInfo: {
            title: "RFID 미등록 차량 통행 안내",
            details: [
              { icon: Car, text: "차량 번호판 자동 인식" },
              { icon: Clock, text: "통행 후 7일 이내 납부" },
              { icon: CreditCard, text: "온라인/오프라인 결제 가능" }
            ],
            link: { text: "결제 안내 페이지 바로가기", url: "#" }
          },
          type: 'detailed'
        },
        {
          text: "도움이 되셨다니 다행입니다! 다른 질문이 없으시면 상담을 종료하겠습니다.",
          satisfaction: true,
          type: 'closing'
        }
      ]
    },
    2: {
      title: "회원 조회",
      icon: CreditCard,
      responses: [
        {
          text: "안녕하세요! 말레이시아 MLFF 통행료 서비스입니다. 문의 해결을 위해 회원 로그인을 하시겠어요?",
          options: ["로그인", "비회원으로 계속"],
          type: 'welcome'
        },
        {
          text: "회원 인증이 완료되었습니다. 안녕하세요, 김민수님! 무엇을 도와드릴까요?",
          options: ["미납 내역 확인", "사용 내역 조회", "RFID 등록 상태"],
          type: 'authenticated'
        },
        // --- 미납 내역 시나리오 ---
        {
          text: "미납 내역을 확인하고 있습니다...",
          type: 'loading',
          trigger: "미납 내역 확인"
        },
        {
          text: "김민수님, 현재 미납 내역은 총 2건, RM 12.50 입니다.",
          additionalInfo: {
            title: "미납 통행료 상세 내역",
            details: [
              { icon: MapPin, text: "7/15 - Duke Highway (RM 5.50)" },
              { icon: MapPin, text: "7/20 - SMART Tunnel (RM 7.00)" },
              { icon: Clock, text: "납부 기한: 7/27까지" }
            ],
            link: { text: "지금 결제하기", url: "#" }
          },
          type: 'detailed'
        },
        // --- 사용 내역 시나리오 ---
        {
          text: "사용 내역을 조회하고 있습니다...",
          type: 'loading',
          trigger: "사용 내역 조회"
        },
        {
          text: "김민수님, 최근 1개월 사용 내역은 총 5건, RM 25.00 입니다.",
          additionalInfo: {
            title: "최근 통행료 사용 내역",
            details: [
              { icon: MapPin, text: "7/22 - KESAS Highway (RM 2.00)" },
              { icon: MapPin, text: "7/18 - LDP Highway (RM 3.00)" },
              { icon: MapPin, text: "7/15 - Duke Highway (RM 5.50)" },
              { icon: MapPin, text: "7/10 - SMART Tunnel (RM 7.00)" },
              { icon: MapPin, text: "7/02 - NPE Highway (RM 7.50)" },
            ],
            link: { text: "전체 내역 다운로드", url: "#" }
          },
          type: 'detailed'
        },
        // --- RFID 상태 시나리오 ---
        {
          text: "RFID 등록 상태를 조회하고 있습니다...",
          type: 'loading',
          trigger: "RFID 등록 상태"
        },
        {
          text: "김민수님의 차량(ABC 1234)은 RFID 태그가 정상적으로 등록 및 활성화되어 있습니다.",
          additionalInfo: {
            title: "RFID 태그 정보",
            details: [
              { icon: Car, text: "차량번호: ABC 1234" },
              { icon: CheckCircle, text: "상태: 활성화 (Active)" },
              { icon: CreditCard, text: "연결된 카드: ****-****-****-5678" }
            ],
            link: { text: "태그 정보 수정하기", url: "#" }
          },
          type: 'detailed'
        },
        // --- 공통 마무리 ---
        {
          text: "확인하셨습니까? 다른 문의사항이 있으신가요?",
          satisfaction: true,
          type: 'closing'
        }
      ]
    },
    3: {
      title: "상담사 전환",
      icon: Phone,
      responses: [
        {
          text: "안녕하세요! 말레이시아 MLFF 통행료 서비스입니다. 어떤 도움이 필요하신가요?",
          type: 'welcome'
        },
        {
          text: "번호판 오인식 문제로 확인해보겠습니다. 잠시만 기다려주세요...",
          type: 'loading'
        },
        {
          text: "고객님, 해당 문제는 전문 상담사의 확인이 필요합니다. 상담사를 연결해 드릴까요?",
          options: ["네, 연결해주세요", "나중에 할게요"],
          type: 'escalation'
        },
        {
          text: "상담사를 연결중입니다. 잠시만 기다려주세요...",
          additionalInfo: {
            title: "상담사 연결 안내",
            details: [
              { icon: Clock, text: "예상 대기시간: 2-3분" },
              { icon: User, text: "현재 대기 인원: 3명" },
              { icon: Phone, text: "운영 시간: 09:00 - 18:00" }
            ]
          },
          type: 'connecting'
        },
        {
          text: "안녕하세요, 상담사 이지현입니다. AI와 나누신 대화 내용은 모두 확인했습니다. 번호판 오인식 문제로 문의주셨군요. 7월 5일자 통행 기록을 확인해보겠습니다.",
          agent: true,
          type: 'agent'
        },
        {
          text: "고객님, 7월 5일 14:30에 Duke 하이웨이를 통과한 기록이 확인됩니다. 해당 차량 이미지를 확인해보니 번호판이 일부 가려져 있어 오인식된 것으로 보입니다. 즉시 수정 처리해드리겠습니다.",
          agent: true,
          additionalInfo: {
            title: "처리 결과",
            details: [
              { icon: CheckCircle, text: "잘못 부과된 요금 취소 완료" },
              { icon: CreditCard, text: "환불 예정일: 영업일 3-5일" },
              { icon: FileText, text: "처리번호: CS2024-0705-1234" }
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

      // loading 타입일 경우 자동으로 다음 메시지 진행
      if (response.type === 'loading') {
        const currentResponses = scenarios[activeScenario].responses;
        const currentIndex = currentResponses.indexOf(response);
        
        if (currentIndex !== -1) {
          // loading 메시지 바로 다음의 응답을 찾는다.
          const nextStep = currentIndex + 1;
          if (nextStep < currentResponses.length && !currentResponses[nextStep].trigger) {
            setCurrentStep(nextStep);
            setTimeout(() => {
              addBotMessage(currentResponses[nextStep]);
            }, 500);
          }
        }
      }
    }, typingTime);
  }, [activeScenario, scenarios]);

  useEffect(() => {
    // 시나리오 변경 시 초기화
    setMessages([]);
    setCurrentStep(0);
    setSatisfactionStatus({});
    setIsTyping(false);

    // 새 시나리오의 첫 메시지 표시
    setTimeout(() => {
      addBotMessage(scenarios[activeScenario].responses[0]);
    }, 500);
  }, [activeScenario, addBotMessage, scenarios]);

  const handleSend = () => {
    if (inputValue.trim() === '') return;

    // 사용자 메시지 추가
    setMessages(prev => [...prev, {
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    }]);

    setInputValue('');

    // 다음 봇 응답
    const nextStep = currentStep + 1;
    if (nextStep < scenarios[activeScenario].responses.length) {
      setCurrentStep(nextStep);
      addBotMessage(scenarios[activeScenario].responses[nextStep]);
    }
  };

  const handleOptionClick = (option) => {
    // 옵션 클릭을 사용자 메시지로 처리
    setMessages(prev => [...prev, {
      text: option,
      sender: 'user',
      timestamp: new Date()
    }]);

    const currentResponses = scenarios[activeScenario].responses;
    // 'trigger' 속성이 옵션 텍스트와 일치하는 응답을 찾는다.
    const nextStepIndex = currentResponses.findIndex(r => r.trigger === option);

    if (nextStepIndex !== -1) {
      setCurrentStep(nextStepIndex);
      addBotMessage(currentResponses[nextStepIndex]);
    } else {
      // 일치하는 trigger가 없는 경우 (예: 로그인, 비회원 계속 등) 기존 로직을 유지
      const nextStep = currentStep + 1;
      if (nextStep < currentResponses.length) {
        setCurrentStep(nextStep);
        addBotMessage(currentResponses[nextStep]);
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
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const MessageBubble = ({ message, index }) => {
    const isBot = message.sender === 'bot';
    const isAgent = message.sender === 'agent';
    const isUser = message.sender === 'user';
    const selectedSatisfaction = satisfactionStatus[index];

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
              <p className="text-xs text-purple-600 font-medium mb-1">상담사 이지현</p>
            )}
            <div className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-blue-500 text-white rounded-tr-none'
                : isAgent
                ? 'bg-purple-100 text-gray-800 rounded-tl-none'
                : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              <p className="text-sm leading-relaxed">{message.text}</p>

              {/* 상세 정보 카드 */}
              {message.additionalInfo && (
                <div className="mt-3 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">{message.additionalInfo.title}</h4>
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

              {/* 만족도 조사 */}
              {message.satisfaction && (
                <div className="mt-3">
                  {!selectedSatisfaction ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSatisfaction(index, 'satisfied')}
                        className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        만족
                      </button>
                      <button
                        onClick={() => handleSatisfaction(index, 'unsatisfied')}
                        className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        불만족
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
                          <span className="text-green-700 font-medium">감사합니다! 😊</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-600 mr-2 animate-scale-in" />
                          <span className="text-red-700 font-medium">개선하겠습니다 🙏</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 옵션 버튼들 */}
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
                <h1 className="text-lg font-semibold">MLFF 고객 지원</h1>
                <p className="text-xs text-blue-100">AI 상담사가 도와드립니다</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs">온라인</span>
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
            placeholder="메시지를 입력하세요..."
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
            통행 내역
          </button>
          <button className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 whitespace-nowrap hover:bg-gray-200 transition-colors">
            <CreditCard className="w-3 h-3 mr-1" />
            미납 요금
          </button>
          <button className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-600 whitespace-nowrap hover:bg-gray-200 transition-colors">
            <Car className="w-3 h-3 mr-1" />
            RFID 등록
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;