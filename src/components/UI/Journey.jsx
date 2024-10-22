import React from "react";
import suitcase from '../../assets/images/suitcase-line.png';

const Journey = () => {
    return (
        <section id="journey">
            <div className="container lg:pt-5">
                <div className="text-center">
                    <h2 className="text-headingColor font-[800] text-[2.4rem] mb-5">
                        My Journey
                    </h2>
                    {/* <p className="lg:max-w-[600px] lg:mx-auto text-headingColor font-[500] text-[16px] leading-7">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p> */}
                </div>

                <div className="flex flex-col justify-center sm:py-12">
                    <div className="w-full py-3 px-2 sm:max-w-5xl sm:mx-auto sm-px-0">
                        <div className="relative text-gray-700 antialiased text-sm font-semibold">

                    {/* {  ======================= vertical line runing through the middle =======================  } */}
                    <div className="hidden absolute w-1 sm:block bg-indigo-300 h-full left-1/2 transform -translate-x-1/2"></div>

                    {/* {  ======================= right card =======================  } */}
                    <div className="mt-6 sm:mt-0 sm:mb-12">
                        <div className="flex items-center flex-col sm:flex-row">
                            <div className="flex justify-end w-full mx-auto items-center">
                                <div className="w-full sm:w-1/2 sm:pl-8">
                                    <div
                                        data-aos="fade-left"
                                        data-aos-duration="1200"
                                        className="bg-white p-4 rounded shadow group hover:bg-primaryColor cursor-pointer ease-in duration-150"
                                    >
                                        <h3 className="text-primaryColor font-[1000] mb-1 group-hover:text-white group-hover:font-[1000] text-xl">
                                            NCS Pte Ltd
                                        </h3>

                                        <h2 className="text-headingColor font-[700] mb-1 group-hover:text-white group-hover:font-[700] text-lg">
                                            Software Engineer
                                        </h2>

                                        <p className="text-[15px] font-[600] text-smallTextColor mb-2 group-hover:text-white group-hover:font-[600] leading-7">
                                            Jul 2024 - Present
                                        </p>

                                        <p className="flex gap-2 text-[15px] font-[500] text-smallTextColor group-hover:text-white group-hover:font-[500] leading-7">
                                            <span><i class="ri-check-line"></i></span>
                                            Completed training bootcamp project focused on designing and developing a full-stack web application using Spring Boot and .NET framework.
                                        </p>

                                    </div>
                                </div>
                            </div>

                            <div className="rounded-full bg-primaryColor border-white border-4 w-10 h-10 absolute left-1/2 transform -translate-x-1/2 -translate-y-4 sm:translate-y-0 flex items-center justify-center">
                                <figure>
                                    <img src={suitcase} alt="" />
                                </figure>
                            </div>
                        </div>
                    </div>
                    
                    {/* {  ======================= left card =======================  } */}
                    <div className="mt-6 sm:mt-0 sm:mb-12">
                        <div className="flex items-center flex-col sm:flex-row">
                            <div className="flex justify-start w-full mx-auto items-center">
                                <div className="w-full sm:w-1/2 sm:pr-8">
                                    <div
                                        data-aos="fade-right"
                                        data-aos-duration="1200"
                                        className="bg-white p-4 rounded shadow group hover:bg-primaryColor cursor-pointer ease-in duration-150"
                                    >
                                        <h3 className="text-primaryColor font-[1000] mb-1 group-hover:text-white group-hover:font-[1000] text-xl">
                                            NCS Pte Ltd Singapore
                                        </h3>

                                        <h2 className="text-headingColor font-[700] mb-1 group-hover:text-white group-hover:font-[700] text-lg">
                                            Intern (Backend Testing)
                                        </h2>

                                        <p className="text-[15px] font-[600] text-smallTextColor mb-2 group-hover:text-white group-hover:font-[600] leading-7">
                                            May 2023 - Aug 2023
                                        </p>

                                        <p className="flex gap-2 text-[15px] font-[500] text-smallTextColor group-hover:text-white group-hover:font-[500] leading-7">
                                            <span><i class="ri-check-line"></i></span>
                                            Achieved over 90% test coverage on multiple modules through comprehensive backend testing using JUnit Mockito.
                                        </p>

                                        <p className="flex gap-2 text-[15px] font-[500] text-smallTextColor group-hover:text-white group-hover:font-[500] leading-7">
                                            <span><i class="ri-check-line"></i></span>
                                            Leverage hands-on experience with Spring Boot framework and various backend technologies to ensure reliability and efficiency of software systems
                                        </p>

                                    </div>
                                </div>
                            </div>

                            <div className="rounded-full bg-primaryColor border-white border-4 w-10 h-10 absolute left-1/2 transform -translate-x-1/2 -translate-y-4 sm:translate-y-0 flex items-center justify-center">
                                <figure>
                                    <img src={suitcase} alt="" />
                                </figure>
                            </div>
                        </div>
                    </div>

                    {/* {  ======================= right card =======================  } */}
                    <div className="mt-6 sm:mt-0 sm:mb-12">
                        <div className="flex items-center flex-col sm:flex-row">
                            <div className="flex justify-end w-full mx-auto items-center">
                                <div className="w-full sm:w-1/2 sm:pl-8">
                                    <div
                                        data-aos="fade-left"
                                        data-aos-duration="1200"
                                        className="bg-white p-4 rounded shadow group hover:bg-primaryColor cursor-pointer ease-in duration-150"
                                    >
                                        <h3 className="text-primaryColor font-[1000] mb-1 group-hover:text-white group-hover:font-[1000] text-xl">
                                            Continental Automotive Singapore Pte Ltd
                                        </h3>

                                        <h2 className="text-headingColor font-[700] mb-1 group-hover:text-white group-hover:font-[700] text-lg">
                                            Intern (Web Dev)
                                        </h2>

                                        <p className="text-[15px] font-[600] text-smallTextColor mb-2 group-hover:text-white group-hover:font-[600] leading-7">
                                            Jan 2023 - Apr 2023
                                        </p>

                                        <p className="flex gap-2 text-[15px] font-[500] text-smallTextColor group-hover:text-white group-hover:font-[500] leading-7">
                                            <span><i class="ri-check-line"></i></span>
                                            Collaborated with skilled German software engineers, enriching the project with diverse insights.                                        </p>

                                        <p className="flex gap-2 text-[15px] font-[500] text-smallTextColor group-hover:text-white group-hover:font-[500] leading-7">
                                            <span><i class="ri-check-line"></i></span>
                                            Participated in SPRINT planning, shaping development and task management.                                        </p>

                                        <p className="flex gap-2 text-[15px] font-[500] text-smallTextColor group-hover:text-white group-hover:font-[500] leading-7">
                                            <span><i class="ri-check-line"></i></span>
                                            Contributed significantly to feature development, meeting client standards.                                        </p>

                                        <p className="flex gap-2 text-[15px] font-[500] text-smallTextColor group-hover:text-white group-hover:font-[500] leading-7">
                                            <span><i class="ri-check-line"></i></span>
                                            Conducted client demonstrations, showcasing progress and addressing feedback.                                        </p>

                                    </div>
                                </div>
                            </div>

                            <div className="rounded-full bg-primaryColor border-white border-4 w-10 h-10 absolute left-1/2 transform -translate-x-1/2 -translate-y-4 sm:translate-y-0 flex items-center justify-center">
                                <figure>
                                    <img src={suitcase} alt="" />
                                </figure>
                            </div>
                        </div>
                    </div>

                    </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Journey;
