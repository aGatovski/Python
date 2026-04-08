1. Function, variables

Side effects functions - 
# is for comments

named parameters are optional and can be used by name
sep= 
print(f"hello {name}") now we use name as a parameter

f"{num:,}" format it as 1,000 like in american style

def():  #create  a function every line i indent
    maznaaa
nemazna

def(a="optional if we do not pass other value"):
    print(a)

def() a
def(b) b


2.Conditionals
if elif else
 or and, 
 bool int float

 return True if n % 2 == 0 else False
 ===
 return n % 2 == 0

 match ? === switch

 match name:
    case "A" | "C":
        print
    case B:

    case _:    #def

3. Loops

while 

for i in [0,1,2]
for i in range(100000):
for _ in range(3): # _ is a variable but it is not used anywhere
   
print("a" * 3, end="") # aaa mahna li end da ne e \n maham edin red otdolu

list

 len return the number of items in a container.


range(3) a list of 3 items

range(len(list s 3 neshta) ) = range(3)

dict #key value
students = {
   "A":"11",
   "B":"12", 
   "c":1
   }



students = [ 
    {"name":"A", "grade":"2"},
    {"name":"A", "grade": None}]

for student in students:
    print(student["name"])
    print(student["grade"])


# exceptions
#Runtime errors compile time errors
#Python errors?
try:
    #
    #
except ValueError:
   print(sdfksdm)
else:
#NameError:


# Testing
from ... import ...

def main():
    test_neshto()

def test_neshto():
    if :

# make sure I am conditionally callign this if I import it somewhere else
if __main__ == "__main__":
    main()


# assert AssertionError
    assert squar(2) == 4
    assert squar(3) == 9

try:
    assert sq...
except AssertionError:
    print("userfriendly output")

# pytest - adapts conventions
    pip install pytest

pytest test_file.py in cmd to run

import pytest
    with pytest.raises(TypeError):
        testfunc()

  f"hello, {to}" format string

write testable code

# package - module
 have a file named __init__.py in a folder to treat it like a package( is a multiple modules )

# io files
 n  = [] give me empty list
 for _ in range(3):
    name = input("dai si imeto") or
    n.append(input(dai si imeot))

for name in sorted(n):
    print(f"..")

open - open a folder 
file = open("filename", <mode>) mode - w,a
file.write(name)
file.close()

with open(file, mode) as file:
    file.write()...
    automatically closed when the last line finishes

print adds newline if we have a new line in  the file it will become a separate line

string.rstrip()... maha noviq red

with open(file, r) as file:
    for line in file:
        print(hello, line.rstrip())

 # working with this
 for student in sorted(students, key=lamba student: student["name"]):
    print()

import csv

with open("csv") as file:
    reader = csv.reader(file)
    for row in reader:
        students.append({"name": row[0], "home": row[1]})
    for name,home in reader:
        students.append({"name": name, "home": home})
    reader = csv.DictReader(file)
    for row in reader:
        students.append("name":row["name"], "home":row["home"])

with open("csv","a") as file:
    writer = csv.writer(file)
    writer.writerow([name,home])

# automatically quotes incase , is in the text
    writer = csv.DictWriter(file,fieldnames=["names","home"])
    writer.writerow({"name":name, "home" : home})

# images
import sys
from PIL import Image

images= []
for arg in sys.argv[1:]:
    image = Image.open(arg)
    images.append(image)

images[0].save(
    "..gif", save_all=True,append_images[images[1]],duration=200,loop=0
)

# regex 
re.search(pattern, string,flags=0)

import re
re.search("")