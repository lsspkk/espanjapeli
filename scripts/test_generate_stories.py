#!/usr/bin/env python3
"""
Tests for generate_stories.py
"""

import pytest
from generate_stories import parse_story_section


def test_parse_story_section_basic():
    """Test parsing a basic story section"""
    
    story_text = """
--------------------------------------------------------------------------------
STORY A1-01: Meeting Someone New
ID: meeting-new-person
Title EN: Meeting Someone New
Title ES: Conocer a alguien nuevo
Category: social
Difficulty: absolute-beginner
Icon: 👋
--------------------------------------------------------------------------------

DIALOGUE:
María: Hola, me llamo María. ¿Cómo te llamas?
      (Hello, my name is María. What is your name?)
Juan: Hola, soy Juan. Mucho gusto.
      (Hello, I am Juan. Nice to meet you.)

VOCABULARY:
- llamarse = to be called
- ser = to be
- mucho gusto = nice to meet you

QUESTIONS:
Q1: Where is Juan from?
A: Mexico (Correct) / Spain / France / Italy

Q2: What does "mucho gusto" mean?
A: Nice to meet you (Correct) / Goodbye / Thank you / How are you
"""
    
    story = parse_story_section(story_text)
    
    assert story is not None
    assert story['id'] == 'meeting-new-person'
    assert story['titleSpanish'] == 'Conocer a alguien nuevo'
    assert story['title'] == 'Meeting Someone New'
    assert story['level'] == 'A1'
    assert story['category'] == 'social'
    assert story['icon'] == '👋'
    
    # Check dialogue
    assert len(story['dialogue']) == 2
    assert story['dialogue'][0]['speaker'] == 'María'
    assert 'Hola, me llamo María' in story['dialogue'][0]['spanish']
    assert story['dialogue'][1]['speaker'] == 'Juan'
    
    # Check vocabulary
    assert len(story['vocabulary']) == 3
    assert story['vocabulary'][0]['spanish'] == 'llamarse'
    assert story['vocabulary'][0]['finnish'] == 'to be called'
    
    # Check questions
    assert len(story['questions']) == 2
    assert 'Juan from' in story['questions'][0]['question']
    assert len(story['questions'][0]['options']) == 4
    assert story['questions'][0]['correctAnswer'] == 0
    assert story['questions'][0]['options'][0] == 'Mexico'


def test_parse_story_section_with_longer_dialogue():
    """Test parsing a story with more dialogue lines"""
    
    story_text = """
STORY A1-02: What Time Is It?
ID: what-time
Title EN: What Time Is It?
Title ES: ¿Qué hora es?
Category: everyday
Difficulty: absolute-beginner
Icon: 🕐

DIALOGUE:
Ana: Perdona, ¿qué hora es?
     (Excuse me, what time is it?)
Pedro: Son las tres de la tarde.
       (It's three in the afternoon.)
Ana: Gracias. ¿A qué hora cierra la tienda?
     (Thanks. What time does the shop close?)
Pedro: Cierra a las ocho de la noche.
       (It closes at eight in the evening.)

VOCABULARY:
- qué hora = what time
- la tarde = the afternoon
- cerrar = to close

QUESTIONS:
Q1: What time is it now?
A: 3 PM (Correct) / 8 PM / 12 PM / 5 PM
"""
    
    story = parse_story_section(story_text)
    
    assert story is not None
    assert story['id'] == 'what-time'
    assert len(story['dialogue']) == 4
    assert story['dialogue'][0]['speaker'] == 'Ana'
    assert story['dialogue'][1]['speaker'] == 'Pedro'
    assert story['dialogue'][2]['speaker'] == 'Ana'
    assert story['dialogue'][3]['speaker'] == 'Pedro'


def test_parse_story_section_invalid():
    """Test that invalid sections return None"""
    
    story_text = """
Some random text without proper format
"""
    
    story = parse_story_section(story_text)
    assert story is None


def test_level_mapping():
    """Test that difficulty levels map correctly to CEFR"""
    
    test_cases = [
        ('absolute-beginner', 'A1'),
        ('beginner', 'A2'),
        ('intermediate', 'B1'),
        ('advanced', 'B2')
    ]
    
    for difficulty, expected_level in test_cases:
        story_text = f"""
STORY TEST: Test Story
ID: test-story
Title EN: Test Story
Title ES: Historia de Prueba
Difficulty: {difficulty}

DIALOGUE:
Speaker: Text
       (Translation)

VOCABULARY:
- word = translation

QUESTIONS:
Q1: Question?
A: Answer (Correct) / Wrong
"""
        story = parse_story_section(story_text)
        assert story is not None
        assert story['level'] == expected_level


def test_word_count_calculation():
    """Test that word count is calculated correctly"""
    
    story_text = """
STORY TEST: Test Story
ID: test-story
Title EN: Test Story
Title ES: Historia de Prueba
Difficulty: beginner

DIALOGUE:
Ana: Hola, ¿cómo estás?
     (Hello, how are you?)
Pedro: Muy bien, gracias.
       (Very well, thanks.)

VOCABULARY:
- hola = hello

QUESTIONS:
Q1: Question?
A: Answer (Correct) / Wrong
"""
    
    story = parse_story_section(story_text)
    assert story is not None
    # "Hola, ¿cómo estás?" = 3 words
    # "Muy bien, gracias." = 3 words
    # Total = 6 words
    assert story['wordCount'] == 6
    assert story['estimatedMinutes'] >= 2


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
