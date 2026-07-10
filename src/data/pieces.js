
import EntenBauer from "../assets/EntenBauer.png";
import EntenDame from "../assets/EntenDame.png";
import EntenKönig from "../assets/EntenKönig.png";
import EntenLäufer from "../assets/EntenLäufer.png";
import Entenspringer from "../assets/Entenspringer.png";
import Ententurm from "../assets/Ententurm.png";

import SchneckenLäufer from "../assets/SchneckelLäufer.png";
import SchneckenBauer from "../assets/SchneckenBauer.png";
import SchneckenDame from "../assets/SchneckenDame.png";
import SchneckenKönig from "../assets/SchneckenKönig.png";
import Schneckenspringer from "../assets/Schneckenspringer.png";
import Schneckenturm from "../assets/Schneckenturm.png";

export const pieces = {

    E_Bauer: {
        type: "Bauer",
        team: "Ente",
        image: EntenBauer
    },
    E_Dame: {
        type: "Dame",
        team: "Ente",
        image: EntenDame
    },
    E_Koenig: {
        type: "König",
        team: "Ente",
        image: EntenKönig
    },
    E_Laeufer: {
        type: "Läufer",
        team: "Ente",
        image: EntenLäufer
    },
    E_Springer: {
        type: "Springer",
        team: "Ente",
        image: Entenspringer
    },
    E_Turm: {
        type: "Turm",
        team: "Ente",
        image: Ententurm
    },

    S_Bauer: {
        type: "Bauer",
        team: "Schnecke",
        image: SchneckenBauer
    },
    S_Dame: {
        type: "Dame",
        team: "Schnecke",
        image: SchneckenDame
    },
    S_Koenig: {
        type: "König",
        team: "Schnecke",
        image: SchneckenKönig
    },
    S_Laeufer: {
        type: "Läufer",
        team: "Schnecke",
        image: SchneckenLäufer
    },
    S_Springer: {
        type: "Springer",
        team: "Schnecke",
        image: Schneckenspringer
    },
    S_Turm: {
        type: "Turm",
        team: "Schnecke",
        image: Schneckenturm
    }
};