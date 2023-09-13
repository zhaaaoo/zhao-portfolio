import amadeus from "../images/amadeus.png";
import shibushi from "../images/shibushi.png";

const portfolios = [
  {
    id: "01",
    imgUrl: amadeus,
    title: "Amadeus",
    description:
      "Project Amadeus, is a dynamic website designed to cater to the informational needs of RSAF's soldiers. It leverages natural language processing techniques to categorize news articles and educational papers on topics such as electronic warfare, Ukraine, lag-pursuit, yo-yo, and more, providing a valuable resource for military personnel.",
    technologies: ["Ruby", "Rails", "SideKiq", "Redis", "Bootstrap"],
    siteUrl: "https://github.com/Service-Design-Studio/final-project-group-5-amadeus",
  },
  {
    id: "02",
    imgUrl: shibushi,
    title: "ShiBuShi? 试不试？",
    description:
      "Lorem ipsum dolor sit, amet consectetur adipisicing elit. Praesentium vitae sunt magnam numquam esse ipsam? Quis qui enim, temporibus dignissimos atque repellendus amet a velit. Dolorem quidem animi doloribus saepe!",
    technologies: ["Java", "Android Studio", "Cloud Firestore"],
    siteUrl: "https://github.com/zhaaaoo/ShiBuShi",
  }
];

export default portfolios;
