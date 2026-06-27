key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOWtYg1bgpWPZvgdNWk1MLCrTfhhn+AAIG0xo7jh5cY4 immo-match\n"
path = "/root/.ssh/authorized_keys"
current = open(path).read()
if "immo-match" in current:
    print("Cle deja presente")
else:
    open(path, "a").write(key)
    print("Cle ajoutee avec succes")
