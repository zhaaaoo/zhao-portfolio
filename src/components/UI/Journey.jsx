import React from "react";
import suitcase from '../../assets/images/suitcase-line.png';
import journey from '../../assets/data/journey';

const Journey = () => {
    return (
        <section id="journey">
            <div className="container lg:pt-5">
                <div className="text-center">
                    <h2 className="text-headingColor font-[800] text-[2.4rem] mb-5">
                        My Journey
                    </h2>
                </div>

                <div className="flex flex-col justify-center sm:py-12">
                    <div className="w-full py-3 px-2 sm:max-w-5xl sm:mx-auto sm-px-0">
                        <div className="relative text-gray-700 antialiased text-sm font-semibold">

                    {/* {  ======================= vertical line runing through the middle =======================  } */}
                    <div className="hidden absolute w-1 sm:block bg-indigo-300 h-full left-1/2 transform -translate-x-1/2"></div>

                    {journey.map((item, index) => {
                        const right = index % 2 === 0;

                        return (
                            <div className="mt-6 sm:mt-0 sm:mb-12" key={item.id}>
                                <div className="flex items-center flex-col sm:flex-row">
                                    <div className={`flex ${right ? "justify-end" : "justify-start"} w-full mx-auto items-center`}>
                                        <div className={`w-full sm:w-1/2 ${right ? "sm:pl-8" : "sm:pr-8"}`}>
                                            <div
                                                data-aos={right ? "fade-left" : "fade-right"}
                                                data-aos-duration="1200"
                                                className="bg-white p-4 rounded shadow group hover:bg-primaryColor cursor-pointer ease-in duration-150"
                                            >
                                                <h3 className="text-primaryColor font-[1000] mb-1 group-hover:text-white group-hover:font-[1000] text-xl">
                                                    {item.company}
                                                </h3>

                                                <h2 className="text-headingColor font-[700] mb-1 group-hover:text-white group-hover:font-[700] text-lg">
                                                    {item.role}
                                                </h2>

                                                <p className="text-[15px] font-[600] text-smallTextColor mb-2 group-hover:text-white group-hover:font-[600] leading-7">
                                                    {item.period}
                                                </p>

                                                {item.points.map((point, i) => (
                                                    <p key={i} className="flex gap-2 text-[15px] font-[500] text-smallTextColor group-hover:text-white group-hover:font-[500] leading-7">
                                                        <span><i className="ri-check-line"></i></span>
                                                        {point}
                                                    </p>
                                                ))}

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
                        )
                    })}

                    </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Journey;
