import React, {useState, useEffect} from "react";
import data from '../../assets/data/portfolioData';
import Modal from "./Modal";

const Portfolio = () => {
    const [nextItems, setNextItems] = useState(6)
    const [portfolios] = useState(data)
    const [showModal, setShowModal] = useState(false)
    const [activeID, setActiveID] = useState(null)

    const loadMoreHandler = () => {
        setNextItems(prev => prev + 3)
    }

    const showModalHandler = (id) => {
        setShowModal(true)
        setActiveID(id)
    }

    useEffect(() => {
        if (showModal) {
            document.body.style.overflowY = 'hidden'
        } else {
            document.body.style.overflowY = 'scroll'
        }
    }, [showModal])

    return (
    <section id="portfolio">
        <div className="container">

            <div className="flex items-center justify-between flex-wrap">
                <div className="mb-7 sm:mb-0">
                    <h3 className="text-headingColor text-[2rem] font-[700]">
                        My recent projects
                    </h3>
                </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap mt-12">
                {
                    portfolios?.slice(0, nextItems)?.map((portfolio, index) => (
                        <div
                            onClick={() => showModalHandler(portfolio.id) }
                            key={index}
                            data-aos="fade-zoom-in" 
                            data-aos-delay="50" 
                            data-aos-duration="1000" 
                            className="group max-w-full sm:w-[48.5%] md:w-[31.8%] lg-w-[32.2%] relative z-[1] cursor-pointer">
                            <figure>
                                <img
                                    className="rounded-[8px] duration-200  hover:scale-105"
                                    src={portfolio.imgUrl} alt="" 
                                />
                            </figure>
                        </div>
                    ))
                }
            </div>

            <div className="text-center mt-6">

                {
                    nextItems < portfolios.length && data.length >6 && (
                        <button 
                            onClick={loadMoreHandler} 
                            className="text-white bg-primaryColor hover:bg-smallTextColor py-2 px-4 rounded-[8px] font-[500] ease-in duration-200"
                        >
                            Load More
                        </button>
                    )
                }

            </div>
        </div>

        {
            showModal && <Modal setShowModal={setShowModal} activeID={activeID} />
        }

    </section>
    )
}

export default Portfolio