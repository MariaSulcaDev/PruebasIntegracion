DROP TABLE IF EXISTS persona;

CREATE TABLE persona (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    telefono VARCHAR(20),
    fecha_nacimiento VARCHAR(10)
);

INSERT INTO persona (nombre, apellido, email, telefono, fecha_nacimiento) VALUES ('Maria Aurora', 'Sulca Barrera', 'maria.sulca.b@vallegrande.edu.pe', '987654321', '1999-04-12');
INSERT INTO persona (nombre, apellido, email, telefono, fecha_nacimiento) VALUES ('Carlos Eduardo', 'Ramirez Torres', 'carlos.ramirez@vallegrande.edu.pe', '912345678', '1998-08-25');
INSERT INTO persona (nombre, apellido, email, telefono, fecha_nacimiento) VALUES ('Ana Lucia', 'Mendoza Quispe', 'ana.mendoza@vallegrande.edu.pe', '945678123', '2000-01-30');
