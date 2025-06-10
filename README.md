# Braintree Hosted Fields Demo

A simple Flask app demonstrating Braintree Hosted Fields integration for payments.

## Features

- Braintree Hosted Fields UI for card payments
- Provided sandbox test cards and negative testing info for ease of testing (available at the UI sidebar)
- Total amount can be modified before making payment (negative testing)
- at the UI side bar, can login to simulate member flow
   * you can simulate CIT flow, CIT to save card flow & Vaulted CIT flow


## Requirements

- Python 3.7+
- [pip](https://pip.pypa.io/en/stable/)
- (Optional) [virtualenv](https://virtualenv.pypa.io/en/latest/)

## Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/braintree-dropin-demo.git
   cd braintree-dropin-demo
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the app:**
   ```bash
   python application.py
   ```

5. **Open your browser and go to:**
   ```
   http://localhost:5000
   ```