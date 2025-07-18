# This program generates a circle using ASCII block characters. Starting point for greater projects.
width = int(input("Enter width of circle: "));
height = int(input("Enter height of circle: "));
s = "";
for y in range(height):
    for x in range(width):
        if (((x + 0.5) / width - 0.5) ** 2 + ((y + 0.5) / height - 0.5) ** 2) ** 0.5 < 0.5:
            s = s + "▓▓";
        else:
            s = s + "░░";
    s = s + "\n";
print(s);
