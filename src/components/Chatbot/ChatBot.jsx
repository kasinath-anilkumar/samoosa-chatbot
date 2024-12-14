import { GoogleGenerativeAI } from '@google/generative-ai';
import React, { useEffect, useRef, useState } from 'react';
import './ChatBot.css';
import { AiOutlineArrowRight } from 'react-icons/ai';
import { TiWeatherSnow } from "react-icons/ti";
import chatBotIcon from './images/assistant.png'
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
// import {contactInfo} from './systemInstructions/contactInfo.js'
// import {generalInstruction} from './systemInstructions/generalInstructions.js'
// import {insuranceInfo} from './systemInstructions/insuranceInfo.js'
// import {policy} from './systemInstructions/policy.js'
import Logo from '../../assets/logo.png'

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [chatHistory, setChatHistory] = useState([]);
    const [showRelatedQuestions, setShowRelatedQuestions] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const [genAI, setGenAI] = useState(null);
    const endOfChatRef = useRef(null);
    const inputRef = useRef(null);
    const [show, setShow] = useState(false);
    const [userPerference, setUserPreference] = useState('')

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const handlePreferedLanguage = (language) => {
        console.log("Selected language:", language); // Log the selected language for debugging
        setUserPreferedlangauge(language); // Update the selected language state
        setDropdownVisible(false); // Close the dropdown after selecting a language
    };
    


    useEffect(() => {
        if (apiKey) {
            setGenAI(new GoogleGenerativeAI(apiKey));
            // Initialize chat history with a welcome message from the bot
            setChatHistory([{
                role: 'bot',
                parts: [{ text: 'Hey there! I\'m Samoosa, your personal assistant, ask me anything, and let’s roll!' }],
            }]);
        }
    }, [apiKey]);

    const toggleChat = () => setIsOpen(!isOpen);

    useEffect(() => {
        document.body.classList.toggle('chatbot-open', isOpen);
    }, [isOpen]);

    const handleInputChange = (event) => setUserInput(event.target.value);

    const handleSendMessage = async () => {
        if (!userInput.trim() || !genAI) return;

        const userMessage = { role: 'user', parts: [{ text: userInput }] };
        setChatHistory((prev) => [...prev, userMessage]);
        setLoading(true);

        try {
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: `your name is samoosa, answer all question`
            });

            // Prepare the chat history for the AI model
            const chatSession = model.startChat({
                generationConfig: { temperature: 2, topP: 0.6, maxOutputTokens: 1000 },
                history: chatHistory.filter(entry => entry.role === 'user').concat(userMessage), // Only user messages
            });

            const result = await chatSession.sendMessage(userInput);
            const botMessage = await result.response.text();
            const formattedResponse = formatResponse(botMessage);

            const botResponse = { role: 'bot', parts: [{ text: formattedResponse }] };
            setChatHistory((prev) => [...prev, botResponse]); // Update chat history with bot response

            await handleRelatedQuestions(chatSession, userInput);
        } catch (error) {
            console.error('Error occurred:', error);
            const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again later.';
            setChatHistory((prev) => [...prev, { role: 'bot', parts: [{ text: errorMessage }] }]);
        } finally {
            setLoading(false);
        }

        setUserInput(''); // Clear input after sending
    };

    const formatResponse = (response) => {
        // Remove stray * characters and format bold text
        return response
            .replace(/\*\*(.*?)\*\*/g, (match, p1) => (
                `<br />
                <span style="color: red; font-weight: 500; font-size: 18px;">
                    ✦
                    <span style="color: black;">
                        ${p1}
                    </span>
                </span>`
            ))
            .replace(/\*/g, '')
            .trim();
    };


    const handleRelatedQuestions = async (chatSession, userInput) => {
        const relatedQuestionsPrompt = `Generate 3 related questions only."${userInput}`;
        const relatedQuestionsResponse = await chatSession.sendMessage(relatedQuestionsPrompt);
        const relatedQuestionsText = await relatedQuestionsResponse.response.text();
        const relatedQuestions = relatedQuestionsText.replace(/\*/g, '').split('\n').filter(question => question.trim() !== '');

        if (relatedQuestions.length > 0) {
            setChatHistory((prev) => [...prev, { role: 'bot', parts: [{ text: 'Here are some questions you might find helpful:' }] }]);
            relatedQuestions.forEach((question) => {
                setChatHistory((prev) => [...prev, { role: 'bot', parts: [{ text: `• ${question}` }] }]);
            });
        }
    };

    const handlePromptClick = (prompt) => {
        setUserInput(prompt);
        inputRef.current.focus();
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSendMessage();
        }
    };

    useEffect(() => {
        if (endOfChatRef.current) {
            endOfChatRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory]);

    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    useEffect(() => {
        // Show the message "Ask me!" every 10 seconds
        const intervalId = setInterval(() => {
            setMessage('Ask me!');
            setShowMessage(true);

            // Hide the message after 3 seconds
            setTimeout(() => {
                setShowMessage(false);
            }, 1000);
        }, 2000);

        // Clear the interval when component unmounts
        return () => clearInterval(intervalId);
    }, []);


    // Toggle the visibility of the dropdown
    const handlePreferredLanguage = () => {
        setDropdownVisible(!isDropdownVisible);
    };

    return (
        <>
            {/* <div className='icon-main'>
                <button
                    className="chatbot-toggle-button"
                    onClick={() => { toggleChat(); handleShow(); }}
                    aria-label="Toggle chat"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }} // Adjust gap as needed
                >
                    <img className="bot-icon" style={{ width: '50px' }} src={chatBotIcon} alt="Chatbot icon" />
                </button>
                <div>
                    {showMessage && <span className="ask-me-message">Hey there,</span>}
                </div>
            </div> */}

            {isOpen && (
                <div className="chatbot-container fullscreen pt-2">
                    <div className="chatbot-header mt-0 pt-0" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <img src={Logo} alt="Logo" style={{ width: '130px' }} />

                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button className="close-btn" onClick={toggleChat} aria-label="Close chat">
                                <AiOutlineArrowRight />
                            </button>
                            <i onClick={toggleChat} className="fa-solid fa-angle-down close-icon text-2xl m-0 me-0"></i>
                        </div>
                    </div>

                    <hr className='top-border-line' style={{ marginTop: '20px' }} />
                    <div className='window-main-div'>
                        {/* <div className="header-title px-2" style={{ textAlign: 'left' }}>
                            <span className='text-purple-700 font-semibold text-xs'> Hey there ✦</span>

                        </div> */}
                        <div className='px-2 mt-3 head-title' style={{ textAlign: 'left' }}>
                            <span className='text-3xl font-bold'>Meet <span className='text-purple-700 font-semibold'> Samoosa</span>  <span style={{ color: 'purple' }}>✦</span></span><br />
                        </div>
                        <div style={{ textAlign: 'left' }} className='px-2 mt-2 uncover-title'>
                            <span className='font-bold text-2xl pt-8 '>Your All-in-One Personal Chat Assistant for Everything You Need!<span style={{ color: 'purple' }}></span>!..</span>
                        </div>
                        <div className="popular-prompts">
                            <h3>Popular enquiry</h3>
                            {['I need to organize my workspace for better productivity', 'How to lose weight fast?', 'How to make money online?'].map((prompt, index) => (
                                <button className='popular-prompt-text' key={index} onClick={() => handlePromptClick(prompt)} style={{ color: 'black' }}>
                                    <TiWeatherSnow style={{ color: 'purple', marginRight: '10px', fontSize: '1.5rem' }} /> {prompt}
                                </button>

                            ))}

                        </div>
                        {/* Chat */}
                        <div className="chat-history">
                            {chatHistory.map((entry, index) => {
                                const messageText = entry.parts[0].text;
                                const isRelatedQuestion = messageText.startsWith('•');

                                // Only render related question container and buttons if showRelatedQuestions is true
                                if (isRelatedQuestion && !showRelatedQuestions) {
                                    return null; // Don't render anything if showRelatedQuestions is false and the message is a related question
                                }

                                return (
                                    <div key={index} className={`chat-message ${entry.role}`}>
                                        {entry.role === 'bot' ? (
                                            isRelatedQuestion ? (
                                                // Only show button if showRelatedQuestions is true
                                                showRelatedQuestions ? (
                                                    <button
                                                        className="related-question-button"
                                                        onClick={() => handlePromptClick(messageText.replace('• ', ''))}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            color: 'blue',
                                                            cursor: 'pointer',
                                                            textAlign: 'left'
                                                        }}
                                                    >
                                                        <p style={{ color: 'purple', fontSize: '1.4rem', marginBottom: '0px' }}>
                                                            ✦<span className='r-quest-output' style={{ color: 'black', fontSize: '1rem' }}>{messageText}</span>
                                                        </p>
                                                    </button>
                                                ) : null // Hide related question buttons
                                            ) : (
                                                // Render normal bot messages
                                                <span dangerouslySetInnerHTML={{ __html: messageText }} />
                                            )
                                        ) : (
                                            // Render user messages
                                            <span dangerouslySetInnerHTML={{ __html: messageText }} />
                                        )}
                                    </div>
                                );
                            })}

                            {/* Button to toggle related questions visibility */}
                            {chatHistory.some(entry => entry.parts[0].text.startsWith('•')) && (
                                <button onClick={() => setShowRelatedQuestions(!showRelatedQuestions)} style={{ width: '30%', backgroundColor: 'rgb(167, 34, 164)' }} className='btn text-light related-toggle-button'>
                                    {showRelatedQuestions ? 'Hide Related Questions' : 'Show Related Questions'}
                                </button>
                            )}

                            {/* Show loading spinner if needed */}
                            {loading && (
                                <div className="loading-placeholder">
                                    <div className="spinner"></div>
                                    Loading answers...
                                </div>
                            )}

                            {/* Scroll to the end of chat */}
                            <div ref={endOfChatRef} />
                        </div>

                        {/* End of Chat */}

                        {/* Input Box */}
                        <div className='input-main shadow'>
                            <div className="input-container">
                                <input
                                    type="text"
                                    ref={inputRef}
                                    value={userInput}
                                    onChange={handleInputChange}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your question here..."
                                    className="chatbot-input"
                                    aria-label="User input"
                                />
                                <button onClick={handleSendMessage} className="send-btn" style={{ display: userInput ? 'block' : 'none' }} aria-label="Send message">
                                    Ask Samoosa
                                </button>
                            </div>
                            {/* End of Input Box */}
                            <div className="disclaimer">
                                <p>I’m not perfect, so be sure to double-check anything important!</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Modal */}
            {/* <Modal show={show}
                onHide={handleClose}
                centered
                backdrop="static"
                keyboard={false}>
                <Modal.Header style={{ display: 'flex', justifyContent: 'center' }}>
                    <Modal.Title style={{ textAlign: 'center', width: '100%', fontFamily: 'font-family: Arial, Helvetica, sans-serif' }}>Should i help you with</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="btn d-flex justify-content-center">
                        <button
                            className="btn px-4 py-3 m-3"
                            style={{ backgroundColor: '#9b00dd', color: 'black' }}
                            onClick={() => {

                                handleClose();
                                setUserPreference('Buying')

                            }}
                        >
                            Buying a Car
                        </button>
                        <button
                            className="btn btn-dark px-4 py-3 m-3"
                            onClick={() => {
                         
                                handleClose();
                                setUserPreference('Renting')
                            }}
                        >
                            Renting a Car
                        </button>
                    </div>
                </Modal.Body>
            </Modal> */}


        </>
    );
};

export default ChatBot;
