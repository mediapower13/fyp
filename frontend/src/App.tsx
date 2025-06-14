import { useState, useEffect } from "react";
import { CheckCircle, Mail, Wallet, AlertCircle, Loader2 } from "lucide-react";
import { BrowserProvider, Contract } from "ethers";
import './index.css';

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

// Mock contract interactions for demo (replace with your actual contract details)
const mockContract = {
  isRegistered: async (address: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Checking registration for: ${address}`);
    // Return false by default to test the registration flow
    // Change this to true if you want to test the "already registered" state
    return false;
  },
  registerVoter: async (address: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`Registering voter: ${address}`);
    return { wait: async () => {} };
  }
};

// Replace the mock ethers with real ethers implementation
const ethersImplementation = {
  BrowserProvider: BrowserProvider,
  Contract: class {
    constructor(address: string, abi: any[], provider: BrowserProvider) {
      // Store contract instance for future use
      new Contract(address, abi, provider);
      console.log(`Contract created with address: ${address}`, { abi, provider });
    }
    
    async isRegistered(address: string) {
      // For demo purposes, using mock contract
      // Replace this with actual contract call: return await this.contract.isRegistered(address);
      return mockContract.isRegistered(address);
    }
    
    async registerVoter(address: string) {
      // For demo purposes, using mock contract
      // Replace this with actual contract call: return await this.contract.registerVoter(address);
      return mockContract.registerVoter(address);
    }
  }
};

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [studentEmail, setStudentEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: number, type: 'success' | 'error' | 'info', message: string}>>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [sentVerificationCode, setSentVerificationCode] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        addNotification('error', 'MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }

      // Request account access
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      
      if (accounts.length === 0) {
        addNotification('error', 'No accounts found. Please unlock MetaMask.');
        return;
      }

      setAccount(accounts[0]);
      setAccount(accounts[0]);
      setProvider(provider);
      addNotification('success', 'Wallet connected successfully!');
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      // Handle specific MetaMask errors
      if (error.code === 4001) {
        addNotification('error', 'Connection rejected by user.');
      } else if (error.code === -32002) {
        addNotification('error', 'Connection request is already pending. Please check MetaMask.');
      } else {
        addNotification('error', 'Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Generate a 6-digit verification code
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Send verification email using EmailJS or similar service
  const sendVerificationEmail = async (email: string, code: string) => {
    try {
      // Using EmailJS service (you need to sign up at emailjs.com)
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'your_service_id', // Replace with your EmailJS service ID
          template_id: 'your_template_id', // Replace with your EmailJS template ID
          user_id: 'your_user_id', // Replace with your EmailJS user ID
          template_params: {
            to_email: email,
            verification_code: code,
            student_name: email.split('@')[0],
          }
        })
      });

      if (response.ok) {
        return true;
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Email sending error:', error);
      // For demo purposes, we'll simulate successful email sending
      console.log(`Verification code sent to ${email}: ${code}`);
      return true;
    }
  };

  const verifyEmail = async () => {
    if (!studentEmail.endsWith("@students.unilorin.edu.ng")) {
      addNotification('error', 'Please enter a valid UNILORIN student email address');
      return;
    }
    
    setIsVerifyingEmail(true);
    try {
      // Generate verification code
      const code = generateVerificationCode();
      setSentVerificationCode(code);
      
      // Send verification email
      const emailSent = await sendVerificationEmail(studentEmail, code);
      
      if (emailSent) {
        setShowCodeInput(true);
        addNotification('success', `Verification code sent to ${studentEmail}. Please check your email.`);
        console.log(`Demo: Verification code is ${code}`); // Remove this in production
      } else {
        addNotification('error', 'Failed to send verification email. Please try again.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      addNotification('error', 'Failed to send verification email. Please try again.');
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      addNotification('error', 'Please enter a valid 6-digit verification code');
      return;
    }

    setIsVerifyingCode(true);
    try {
      // Simulate code verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (verificationCode === sentVerificationCode) {
        setEmailVerified(true);
        setShowCodeInput(false);
        addNotification('success', 'Email verified successfully! You can now register to vote.');
      } else {
        addNotification('error', 'Invalid verification code. Please try again.');
      }
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const resendVerificationCode = async () => {
    const code = generateVerificationCode();
    setSentVerificationCode(code);
    
    try {
      const emailSent = await sendVerificationEmail(studentEmail, code);
      if (emailSent) {
        addNotification('success', 'New verification code sent to your email.');
        console.log(`Demo: New verification code is ${code}`); // Remove this in production
      } else {
        addNotification('error', 'Failed to resend verification code.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      addNotification('error', 'Failed to resend verification code.');
    }
  };

  const checkRegistration = async (provider: BrowserProvider, user: string) => {
    setIsCheckingRegistration(true);
    try {
      // Replace with your actual contract address and ABI
      const contract = new ethersImplementation.Contract("", [], provider);
      const status = await contract.isRegistered(user);
      setIsRegistered(status);
      if (status) {
        setEmailVerified(true);
        addNotification('info', 'You are already registered to vote!');
      }
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  // Check registration status when account changes
  useEffect(() => {
    if (provider && account) {
      checkRegistration(provider, account);
    }
  }, [provider, account]);

    const registerVoter = async () => {
      if (!provider || !account || !emailVerified) return;
      
      setIsRegistering(true);
      try {
        const signer = await provider.getSigner();
        // Replace with your actual contract address and ABI
        const contract = new ethersImplementation.Contract("", [], signer);
        const tx = await contract.registerVoter(account);
        await tx.wait();
        setIsRegistered(true);
        addNotification('success', 'Registration completed successfully!');
      } catch (error: any) {
        console.error('Registration error:', error);
        addNotification('error', 'Failed to register. Please try again.');
      } finally {
        setIsRegistering(false);
      }
    };
  
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-6">
          <h1 className="text-2xl font-bold text-center mb-6">UNILORIN Voting System</h1>
          
          {/* Notifications */}
          {notifications.map(notification => (
            <div key={notification.id} className={`mb-4 p-3 rounded ${
              notification.type === 'success' ? 'bg-green-100 text-green-700' :
              notification.type === 'error' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {notification.message}
            </div>
          ))}
  
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {isConnecting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Wallet className="mr-2" size={20} />}
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          ) : (
            <div>
              <div className="mb-4 p-3 bg-green-100 rounded flex items-center">
                <CheckCircle className="text-green-600 mr-2" size={20} />
                <span className="text-green-700">Wallet Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
  
              {!emailVerified && !isRegistered ? (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Verify Your Student Email</h2>
                  <div className="mb-4">
                    <input
                      type="email"
                      placeholder="student@students.unilorin.edu.ng"
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full p-2 border rounded"
                      disabled={showCodeInput}
                    />
                  </div>
                  
                  {!showCodeInput ? (
                    <button
                      onClick={verifyEmail}
                      disabled={isVerifyingEmail || !studentEmail}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isVerifyingEmail ? <Loader2 className="animate-spin mr-2" size={20} /> : <Mail className="mr-2" size={20} />}
                      {isVerifyingEmail ? 'Sending...' : 'Send Verification Code'}
                    </button>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full p-2 border rounded mb-2"
                      />
                      <button
                        onClick={verifyCode}
                        disabled={isVerifyingCode || verificationCode.length !== 6}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 mb-2"
                      >
                        {isVerifyingCode ? 'Verifying...' : 'Verify Code'}
                      </button>
                      <button
                        onClick={resendVerificationCode}
                        className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
                      >
                        Resend Code
                      </button>
                    </div>
                  )}
                </div>
              ) : emailVerified && !isRegistered ? (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Register to Vote</h2>
                  <button
                    onClick={registerVoter}
                    disabled={isRegistering}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
                  >
                    {isRegistering ? <Loader2 className="animate-spin mr-2" size={20} /> : <CheckCircle className="mr-2" size={20} />}
                    {isRegistering ? 'Registering...' : 'Register to Vote'}
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <CheckCircle className="text-green-600 mx-auto mb-2" size={48} />
                  <h2 className="text-lg font-semibold text-green-700">Registration Complete!</h2>
                  <p className="text-gray-600">You are now registered to vote in UNILORIN elections.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  export default App;