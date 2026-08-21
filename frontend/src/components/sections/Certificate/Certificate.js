'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';

const Certificate = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [certificates, setCertificates] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();

    // const certificate_url = "https://abcstaging.edmingle.com/nuSource/api/v1/certificates/students";
    // const login_url = "https://abcstaging.edmingle.com/nuSource/api/v1/login";
    
    const certificate_url = "https://abc-api.edmingle.com/nuSource/api/v1/certificates/students";
    const login_url = "https://abc-api.edmingle.com/nuSource/api/v1/login";


    const triggerWhatsapp = async (shortenedUrl,email) => {
        try {
            const response = await axios.post("https://backend.aisensy.com/campaign/t1/api/v2", {
                "apiKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZGY4ZWM5MzY4ZDQ2NmJkZTYwNmY4NiIsIm5hbWUiOiJBQkMgLSBUZWNobm9sb2d5IFRyYWluaW5nICYgVXBza2lsbGluZyIsImFwcE5hbWUiOiJBaVNlbnN5IiwiY2xpZW50SWQiOiI2N2RmOGVjOTM2OGQ0NjZiZGU2MDZmODEiLCJhY3RpdmVQbGFuIjoiRlJFRV9GT1JFVkVSIiwiaWF0IjoxNzQyNzA0MzI5fQ.o6Jhif5O1BFjt6NYKt2rCYRgeZhbvw1w1b_YPT5h1N8",
                "campaignName": "Certificate Link - 29-03-2025",
                "userName": "ABC - Technical Training & Upskilling",
                "destination": email, // Replace with a real number
                // "flow_id": "67e287c18c75f70bf102b638",
                "templateParams": [shortenedUrl],
            //     "media": {
            //     "url": certificate, // Your CloudFront URL
            //     "filename": "Career_Orientation_Workshop-nagapavan_testing.pdf"
            // }
            });

            // Return success with redirect URL
            return {
                success: true,
                redirectUrl: "https://wa.me/917349422999",
                data: response.data
            };
        } catch (error) {
            if (error.response) {
                console.error("Error response from server:", error.response.data);
                console.error("Status code:", error.response.status);
            } else if (error.request) {
                console.error("No response received:", error.request);
            } else {
                console.error("Error setting up request:", error.message);
            }
            // Return error details
            return {
                success: false,
                error: error.response ? error.response.data : error.message
            };
        }
    };
    
    const fetch_Certificates = async (key) => {
        try {
            const response = await axios.get(certificate_url, {
                headers: {
                    "apikey": key,
                    "ORGID": "3"
                }
            });
            
            const certData = response.data.payload.certificates;
            setCertificates(certData || []); // Set empty array if no data
            setIsOpen(true);
        } catch (error) {
            console.error("Error fetching certificates:", error);
            setCertificates([]); // Reset certificates
            toast.error("Error fetching certificates: " + (error.response?.data?.message || error.message));
            resetForm();
        }
    };



    async function shortenUrl(longUrl) {
        try {
          const response = await axios.post(
            'https://api-ssl.bitly.com/v4/shorten',
            {
              long_url: longUrl,
            },
            {
              headers: {
                Authorization: `Bearer ${"9108008c752ee49d8b76e7caa079f42af0673d08"}`,
                'Content-Type': 'application/json',
              },
            }
          );
          return response.data.link;
        }catch(error){
          console.error('Error shortening URL:', error);
          return longUrl;
        }
      }

    const handleDownload = async (certificate) => {
        // const link = document.createElement('a');
        // link.href = certificate;
        // link.download = 'certificate.pdf';

        toast.success('Certificate download link has been sent to WhatsApp.', {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: false,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
    
         
        // const shortenedUrl = await shortenUrl(certificate);

    
        try {
            const res = await triggerWhatsapp(certificate,email);
            if (res.success) {
        
                // Redirect to home after 3 seconds (optional)
                setTimeout(() => {
                    window.location.href = res.redirectUrl;
                    setTimeout(() => {
                        window.open('', '_self').close();
                    }, 1000);
                }, 3000);
            } else {
                toast.error('Failed to send WhatsApp message: ' + res.error.message);
            }
        } catch (err) {
            toast.error('An unexpected error occurred: ' + err.message);
        }
    };


    const resetForm = () => {
        setEmail('');
        setPassword('');
        setStep(1);
        setIsOpen(false);
        setCertificates([]);
    };

    const handleNext = () => {
        setStep(2);
    };

    const handleLogin = async () => {
        setIsLoading(true);
        const formData = new FormData();
        formData.append("JSONString", JSON.stringify({
            "username": email,
            "password": password,
            "persistent_login": true
        }));
    
        try {
            const response = await axios.post(login_url, formData);
            const newApikey = response.data.user.apikey;
            localStorage.setItem("apikey", newApikey);
            
            await fetch_Certificates(newApikey);
        } catch (error) {
            // console.log("Login Error:", error.response?.data?.message);
            toast.error(error.response?.data?.message, {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                });
            resetForm();
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        router.push('/');
        setIsOpen(false);
    };

    return (
        <div>
            <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            />
            {!isOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center'>
                    <div className='bg-white p-6 rounded-md shadow-lg w-[90%] md:w-[40%]'>
                        <h2 className='text-xl text-center mb-4 font-semibold'>Log In</h2>
                        <label className='text-sm text-gray-500'>Whatsapp Number</label>
                        <input 
                            type='email' 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className='w-full bg-[#e8f0fe] p-1 border rounded mb-4'  
                            placeholder='Enter your Whatsapp Number'
                        />
                        {step === 2 && (
                            <>
                                <label className='text-sm text-gray-500'>Password:</label>
                                <input 
                                    type='password' 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className='w-full bg-[#e8f0fe] p-1 border rounded mb-4' 
                                    placeholder='Enter the password sent over email'
                                />
                            </>
                        )}
                        <button 
                            onClick={step === 1 ? handleNext : handleLogin} 
                            disabled={isLoading}
                            className={`bg-[#59a9ff] text-white px-4 py-2 rounded hover:bg-blue-700 w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            {step === 1 ? 'Continue' : (isLoading ? 'Loading...' : 'LOGIN')}
                        </button>
                        <div className='my-4'>
                            <p className='text-sm md:text-md text-gray-900 text-center'>Login and Download your Workshop Certificate</p>
                            <p className='text-xs p-2 my-3 text-gray-500 text-center'>By Signing up, you accept our <span className='text-[#59a9ff]'><a href="https://atoms.abc.courses/terms-and-conditions" target='blank'>terms and conditions</a></span> and <span className='text-[#59a9ff]'><a href='https://atoms.abc.courses/privacy-policy' target='blank'>privacy policy</a></span></p>
                        </div>
                    </div>
                </div>
            )}

            {isOpen && certificates.length >= 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
                <div className="bg-white relative rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 z-10 text-white rounded-full p-1 transition-colors"
                    aria-label="Close"
                    >
                    <X className="w-6 h-6" />
                    </button>
                  {/* Header */}
                  <div className="bg-orange-500 py-3 px-4 sm:py-4 sm:px-6">
                <h2 className="text-lg sm:text-xl font-bold text-white">Certificate Details</h2>
                </div>
          
                  {/* Content */}
                  <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
                    {certificates.length > 0 ? (
                      <ul className="divide-y divide-gray-100">
                        {certificates.map((cert, index) => (
                          <li key={index} className="py-4 first:pt-0 last:pb-0">
                            <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row sm:justify-between">
                                <span className="text-gray-500 sm:w-1/3">Title:</span>
                                <span className="font-medium text-gray-900 sm:w-2/3 sm:text-right">{cert[0]}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between">
                                <span className="text-gray-500 sm:w-1/3">ID:</span>
                                <span className="font-medium text-gray-900 sm:w-2/3 sm:text-right">{cert[3]}</span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:justify-between">
                                <span className="text-gray-500 sm:w-1/3">Issued To:</span>
                                <span className="font-medium text-gray-900 sm:w-2/3 sm:text-right">{cert[8]}</span>
                              </div>
                              <div className="pt-2">
                                <button
                                    onClick={() => handleDownload(cert[9])}
                                //   href={cert[9]}
                                //   target="_blank"
                                //   rel="noopener noreferrer"
                                  className="block w-full text-center rounded-md bg-white border-2 border-orange-500 text-orange-500 font-medium px-4 py-2 hover:bg-orange-50 transition-colors"
                                >
                                  Get Certificate Link
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-500">No Certificates Available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
        </div>
    );
};

export default Certificate;