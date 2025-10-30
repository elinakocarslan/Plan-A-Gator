from typing import List, Dict, Union
from requirements import REQUIREMENTS
from prereq_check import has_taken, verify_prereq_code
import random

'''
returns all courses in a given category that user hasnt taken yet
handles single courses and choice like if u can take either ENC 2256 or ENC 3246
'''

# get all courses for college and category
def courses_eligible(user_codes_set, college: str, category: str) -> List[str]:
    print(f"\nDEBUG: courses_eligible")
    print(f"College: {college}")
    print(f"Category: {category}")
    print(f"User completed courses: {user_codes_set}")

    records = REQUIREMENTS.get(college, {}).get(category, [])
    print(f"All possible courses from REQUIREMENTS: {records}")

    if not records:
        print(f"WARNING: No courses found for {college} - {category}")
        return []

    remaining: List[str] = []
    
    for course in records:
        if isinstance(course, list): 
            print(f"Checking OR group: {course}")

            def course_satisfied(option: str) -> bool:
                if "|" in option:
                    parts = [p.replace(" ", "").upper() for p in option.split("|")]
                    return all(p in user_codes_set for p in parts)
                return option.replace(" ", "").upper() in user_codes_set
            
            if not any(course_satisfied(opt) for opt in course):
                added_opts = []
                for opt in course:
                    if "|" in opt:
                        parts = [p.replace(" ", "").upper() for p in opt.split("|")]
                        remaining.extend(parts)
                        added_opts.append(parts)
                    else:
                        code = opt.replace(" ", "").upper()
                        remaining.append(code)
                        added_opts.append(code)
                print(f"Added OR options {added_opts}")
        else:
            code = course.replace(" ", "").upper()
            print(f"Checking single course: {code}")
            if code not in user_codes_set:
                remaining.append(code)
                print(f"Added course: {code}")
    # Remove duplicates while preserving order
    unique_codes = list(dict.fromkeys(remaining))
    print(f"Final available courses: {unique_codes}")
    return unique_codes

'''
recommendation service, first checks if category is provided
if category is provided then returns up to 4 recs in that category
if category not specified then returns a dict w 2 recs from each category
'''

def recommend_courses(
        college: str, 
        transcipt_codes: List[str], 
        category: str | None = None, 
        per_category_limit: int = 2, 
        category_limit: int = 4,
    ) -> Union[List[str], Dict[str, List[str]]]:
    
    # Normalize and validate input
    if not college or not transcipt_codes:
        print("Warning: Missing college or transcript codes")
        return {} if category is None else []

    # Normalize transcript codes to uppercase
    user_codes = set(code.replace(" ", "").strip().upper() for code in transcipt_codes if code.strip())
    print(f"User completed courses: {user_codes}")

    # If specific category requested
    def random_choices(category_name: str, max_pick: int) -> List[str]:
        # everything that hasnt been taken
        pool = courses_eligible(user_codes, college, category_name)
        pool = [code for code in pool if verify_prereq_code(user_codes, code)]
        print(f"POOL FOR {category_name}: {pool}")
        if not pool:
            return []
        pick_count = min(max_pick, len(pool))
        # random.seed()
        picks = random.sample(pool, pick_count)
        print(f"PICKS FOR {category_name}: {picks}")
        return picks
    
    if category:
        pool = courses_eligible(user_codes, college, category)
        if not pool:
            print(f"User already fulfilled {category} requirements - No recommendation")
            return[]
        return random_choices(category, category_limit)
    
    result: Dict[str, List[str]] = {}
    for category_name in ["Core", "GenEd", "Elective/eligible"]:
        pool = courses_eligible(user_codes, college, category_name)
        print(f"Checking CATEGORY {category_name} -> AVAILABLE COUNT: {len(pool)}")
        if not pool:
            print(f"User already fulfilled {category_name} requirements - skipping.")
            result[category_name] = []
            continue
        result[category_name] = random_choices(category_name, per_category_limit)

    return result