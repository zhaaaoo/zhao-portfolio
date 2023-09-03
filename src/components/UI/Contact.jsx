import React from "react";
import zhao from "../../assets/images/zhao-1.jpg";

const Contact = () => {
    return (
        <section id="contact" className="pb-16">
            <div className="container">
                <h2 className="text-headingColor font-[700] text-[2.5rem] mb-8">Get in touch</h2>
                <div className="md:flex justify-between items-center  bg-indigo-100">


                    <div className="w-full mt-8 md:mt-0 md:w-full lg:flex items-center px-4 lg:px-8 py-8">
                        <div className="w-full">
                            <div className="mb-5">
                                <p className="flex gap-5 text-headingColor font-[500] text-[17px] sm:text-[20px] leading-10 sm:pl-10 sm:pr-5 self-start">
                                <span>
                                    <i class="ri-mail-line"></i>
                                </span>
                                081101wangzhao@gmail.com                  
                                </p>
                            </div>
                            <a href="https://wa.me/86127303" target = "_blank" rel="noreferrer" >
                                <div className="mb-5">
                                    <p className="flex gap-5 text-headingColor font-[500] text-[17px] sm:text-[20px] leading-10 sm:pl-10 sm:pr-5 self-start">
                                    <span>
                                        <i class="ri-phone-line"></i>
                                    </span>
                                    +65 86127303
                                    </p>
                                </div>
                            </a>
                            <a href="https://t.me/zhaaaoo" target = "_blank" rel="noreferrer" >
                                <div className="mb-5">
                                    <p className="flex gap-5 text-headingColor font-[500] text-[17px] sm:text-[20px] leading-10 sm:pl-10 sm:pr-5 self-start">
                                    <span>
                                        <i class="ri-telegram-fill"></i>
                                    </span>
                                    @zhaaaoo
                                    </p>
                                </div>
                            </a>
                        </div>
                    </div>

                    
                    <div className="lg:w-2/5 md:w-2/5 sm:w-2/5 hidden lg:block md:block">
                        <figure>
                            <img src={zhao} alt="" />
                        </figure>
                    </div>

                </div>
            </div>
        </section>
    )
}

export default Contact