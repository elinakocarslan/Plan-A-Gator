REQUIREMENTS = {
    "ENG": {
        "Core": [
            "COP3502C",
            "COP3503C",
            "COT3100",
            "COP3530",
            "CDA3101",
            "CEN3031",
            "CIS4301",
            ["CIS4914", "EGN4952"], # choosing one or other
            "COP4020",
            "COP4533",
            "COP4600",
        ],

        "GenEd": [
            "MAC2311",
            "MAC2312",
            "MAC2313",
            "MAS3114",
            "STA3032",
            "PHY2048",
            "PHY2048L",
            "PHY2049",
            "PHY2049L",
            ["ENC2256", "ENC3246"],   # choosing one or other
        ],

        "Elective/eligible": [
            # 3000-level - can only take up to 2 (dont know if we're including this specification)
            "CAP3020", "CAP3027", "CAP3032", "CAP3034", "CAP3220",

            "CAP4053", "CAP4112", "CAP4136", "CAP4613", "CAP4621", "CAP4641","CAP4730", "CAP4770", "CAP4773",
            "CDA4102", "CDA4630",
            "CEN4072", "CEN4721", "CEN4722", "CEN4725",
            "CGS4104", "CGS4853C",
            "CIS4204", "CIS4213", "CIS4360", "CIS4362",
            "COP4331", "COP4720",
            "COT4501",
            "CNT4520", "CNT4731",
            "CIS4930",
            "CIS4715", 
            "CIS4905",
            "CIS4940",
            "CIS4949",
            "EGN4912",
            "EGN4951",
            "CGS3065",
            "PHI3681",
            "EEL3701C",
            "EEL4712C",
            "EEL4713C",
            "EEL4744C",
            "MAP2302",
        ],
    },

    "CLAS": {
        "Core": [
            "COP3502C",
            "COP3503C",
            "COT3100",
            "COP3530",
            "CDA3101",
            "CEN3031",
            "CIS4301",
            ["CIS4914", "EGN4952"],  # choose one
            "COP4020",
            "COP4533",
            "COP4600",
        ],

        "GenEd": [
            "MAC2311",
            "MAC2312",
            "MAC2313",
            ["MAS3114", "MAS4105"],  # choose one linear algebra
            "STA3032",
            # ["PHY2048", "PHY2053"],   # Physics 1 (choose w or without calc)
            # ["PHY2048L", "PHY2053L"],
            # ["PHY2049", "PHY2054"],   # Physics 2 (choose w or without calc)
            # ["PHY2049L", "PHY2054L"],
            ["PHY2048|PHY2048L", "PHY2053|PHY2053L"],
            ["PHY2049|PHY2049L", "PHY2054|PHY2054L"],
            ["ENC2210", "ENC3246"],
        ],

        "Elective/eligible": [
            "CAP4053", "CAP4112", "CAP4136", "CAP4613", "CAP4621", "CAP4641",
            "CAP4730", "CAP4770", "CAP4773",
            "CDA4102", "CDA4630",
            "CEN4072", "CEN4721", "CEN4722", "CEN4725",
            "CGS4104", "CGS4853C",
            "CIS4204", "CIS4213", "CIS4360", "CIS4362",
            "COP4331", "COP4720",
            "COT4501",
            "CNT4520", "CNT4731",
            "CIS4930",
            "CIS4905",
            "CIS4940",
            "CIS4949",
            "EGN4912",
            "EGN4951",
            "EEL3701C", "EEL4712C", "EEL4713C", "EEL4744C",
            "MAP2302",
            "CGS3065", "PHI3681",
        ],
    },
}

PREREQ_MAP = {
    "MAS3114": ["MAC2312"],     
    "STA3032": ["MAC2311"], 

    "PHY2048L": ["PHY2048"],       
    "PHY2049":  ["PHY2048", "MAC2313"], 
    "PHY2049L": ["PHY2049"],

    "COP3502C": ["MAC2311"],            
    "COP3503C": ["MAC2311", "COP3502C"],
    "COT3100":  ["MAC2311", "COP3503C"], 
    "COP3530":  ["MAC2312", "COP3503C", "COT3100"],
    "CDA3101":  ["MAC2311", "COP3503C", "COT3100"],
    "CEN3031":  ["COP3530"],
    "CIS4301":  ["COP3503C", "COT3100"],
    "COP4020":  ["COP3530"],
    "COP4533":  ["COP3530"],
    "COP4600":  ["COP3530"],
    "CNT4007":  ["COP4600"], 
}
