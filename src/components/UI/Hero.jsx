import React from "react";
import heroImg from '../../assets/images/zhao-2.png';
import Resume from '../../assets/wangzhao_resume.pdf';

const Hero = () => {
    return (
        <section className="pt-0" id='home'>
            <div className="container pt-14">
                <div className="md:flex items-center justify-between sm:flex-col md:flex-row">
                    {/* {  ======================= hero left content =======================  } */}
                    <div className="w-full md:basis-1/2">
                        <h5 data-aos='fade-right' data-aos-duration='1500' className="text-headingColor font-[600] text-[16px]">
                            Hello welcome
                        </h5>
                        <h1 data-aos='fade-up' data-aos-duration='1500' className="text-headingColor font-[800] text-[1.8rem] sm:text-[40px] leading-[35px] sm:leading-[46px] mt-5" >
                            I'm Wang Zhao, <br />Software Developer
                        </h1>

                        <div data-aos='fade-up' data-aos-duration='1800'  data-aos-delay='200' className="flex items-center gap-6 mt-7">
                            <a href="#contact">
                                <button className="bg-primaryColor text-white font-[500] flex items-center gap-2 hover:bg-smallTextColor ease-in duration-300 py-2 px-4 rounded-[8px]">
                                    <i class="ri-mail-line"></i>
                                    Contact me
                                </button>
                            </a>
                            <a href={Resume} target = "_blank" rel="noreferrer" className="text-smallTextColor font-[600] text-[16px] border-b border-solid border-smallTextColor">
                                See resume
                            </a>

                        </div>

                        <p data-aos='fade-left' data-aos-duration='1500' className="flex gap-2 text-headingColor mt-12 font-[500] text-[15px] leading-7 sm:pl-14 sm:pr-10">
                            <span>
                                <i class="ri-graduation-cap-line"></i>
                            </span>
                            Hi! I'm Zhao, and I'm gearing up to toss my graduation cap in April 2024. 
                            Right now, I'm on the lookout for full-time opportunities that revolve around software development.                  
                        </p>

                        <div className="flex items-center gap-9 mt-14">
                            <span className="text-smallTextColor text-[15px] font-[600]">
                                Follow me:
                            </span>
                            <span>
                                <a href="https://github.com/zhaaaoo" target="_blank" rel="noreferrer" className="text-smallTextColor text-[15px] font-[600]">
                                    <i class="ri-github-fill"></i>
                                </a>
                            </span>
                            <span>
                                <a href="https://www.linkedin.com/in/wangzhao-wz/" target="_blank" rel="noreferrer" className="text-smallTextColor text-[15px] font-[600]">
                                    <i class="ri-linkedin-fill"></i>
                                </a>
                            </span>
                        </div>
                    </div>
                    {/* {  ======================= hero left content =======================  } */}
                    {/* {  ======================= hero img =======================  } */}
                    <div className="basis-1/2 mt-10 sm:mt-0">
                        <figure className="flex items-center justify-center">
                            <img src={heroImg} alt="" className="rounded-[150px]"/>
                        </figure>
                    </div>
                    {/* {  ======================= hero img =======================  } */}
                </div>
            </div>
        </section>
    )
}

export default Hero