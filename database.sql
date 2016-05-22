CREATE TABLE users (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  created datetime NOT NULL,
  modified datetime NOT NULL,
  email varchar(128) UNIQUE NOT NULL,
  password varchar(128) NOT NULL,
  name varchar(256) NOT NULL,
  zip varchar(12),
  description text,
  host int(1) NOT NULL DEFAULT 0
);
INSERT INTO users (created, modified, name, email, password, host) VALUES
('now', 'now', 'User one', 'a@a.com', 'a', 1),
('now', 'now', 'Another one', 'b@b.com', 'a', 0);

CREATE TABLE products (
  id integer PRIMARY KEY AUTOINCREMENT,
  created datetime NOT NULL,
  modified datetime NOT NULL,
  name varchar(128) UNIQUE NOT NULL,
  description text,
  code varchar(128),
  manufacturer varchar(128),
  case_size varchar(128)
);

INSERT INTO products (created, modified, name, manufacturer, code, case_size) VALUES
('now', 'now', 'Salt & Vinegar Chips', 'Kettle brand chips', 'upc-8411403333', '1 pack'),
('now', 'now', 'Chocolate Chip Energy Bar', 'Clif Bars Inc.', 'upc-722252100900', '2.4 oz., 12 Bars/Box'),
('now', 'now', 'Bodum Blend', 'East Van Roasters', 'n/a', 'wholesale per pound'),
('now', 'now', 'Castile Classic Lavender Liquid, Soap', 'Dr. Bronners', 'upc-018787774328', '32 oz'),
('now', 'now', 'Lentil Vegetable Soup', 'Amys Organic', 'upc-042272005352', '14.5 fl oz');

CREATE TABLE user_products (
  user_id integer NOT NULL,
  product_id integer NOT NULL,
  amount integer NOT NULL DEFAULT 1,
  price decimal(10,5),
  PRIMARY KEY(user_id, product_id)
);

CREATE TABLE wishlist (
  user_id integer NOT NULL,
  product_id integer NOT NULL,
  amount integer NOT NULL DEFAULT 1,
  PRIMARY KEY(user_id, product_id)
);
