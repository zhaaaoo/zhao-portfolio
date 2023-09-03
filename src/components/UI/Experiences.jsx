import React, {useState} from "react";
import data from '../../assets/data/technologies';

const Experiences = () => {
    const [technologies] = useState(data)

    const sortAlpha = (a, b) => {
        if (a.name < b.name) {
            return -1;
        } else if (a.name > b.name) {
            return 1;
        } else {
            return 0;
        }
    }

    return (
        <section id="experiences">
            <div className="container lg:pt-5">
                <div className="text-center">
                    <h2 className="text-headingColor font-[800] text-[2.4rem] mb-5">
                        Experiences
                    </h2>
                    <p className="lg:max-w-[600px] lg:mx-auto text-headingColor font-[500] text-[16px] leading-7">
                        These are some technologies I've worked with before:    
                    </p>
                </div>

                <div className="w-full grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 text-center py-8 px-2 sm:px-0">
                {
                    technologies?.sort(sortAlpha).map((tech, index) => (
                        <div
                            key={index}
                            data-aos="fade-zoom-in" 
                            data-aos-delay="50" 
                            data-aos-duration="1000"
                            className="py-2 px-2 rounded-lg">
                            <figure>
                                <img
                                    className="rounded-[8px] duration-200 w-20 h-20 sm:w-20 sm:h-20 md:w-20 md:h-20 lg:w-20 lg:h-20 mx-auto hover:scale-105"
                                    src={tech.imgUrl} alt="" 
                                />
                            </figure>
                            <p className="lg:max-w-[600px] lg:mx-auto text-headingColor font-[500] text-[16px] leading-5 mt-4">
                                {tech.name}
                            </p>
                        </div>
                    ))
                }
                </div>
            </div>
        </section>
    )
}

export default Experiences