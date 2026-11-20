from app.services.interview_engine import _extract_skills


def test_java_not_matched_inside_javascript():
    assert "java" not in _extract_skills("I use JavaScript and TypeScript")
    assert "javascript" in _extract_skills("I use JavaScript")


def test_ml_not_matched_inside_html():
    assert "ml" not in _extract_skills("HTML and CSS")
    assert "ml" in _extract_skills("ML and data work")


def test_rest_not_matched_inside_words():
    assert "rest" not in _extract_skills("I am interested in forestry")
    assert "rest" in _extract_skills("Built REST APIs")


def test_special_names():
    assert "c++" in _extract_skills("Skills: C++, Python")
    assert "c#" in _extract_skills("Skills: C#, SQL")
    assert ".net" in _extract_skills("ASP.NET and .NET Core")
    assert "node" in _extract_skills("Node.js and NodeJS")
    assert "react" in _extract_skills("ReactJS")
    assert "java" in _extract_skills("Java, Spring")
    assert "java" not in _extract_skills("C#")
