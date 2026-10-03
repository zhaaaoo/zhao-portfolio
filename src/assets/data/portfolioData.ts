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
      "Shibushi (试不试) is an Android application meticulously crafted using Android Studio and integrated with Google Firestore. This app is dedicated to aiding users in organizing their wardrobes, planning their outfits, and sharing their fashion choices within a like-minded community.",
    technologies: ["Java", "Android Studio", "Cloud Firestore"],
    siteUrl: "https://github.com/zhaaaoo/ShiBuShi",
  }
];

export default portfolios;
